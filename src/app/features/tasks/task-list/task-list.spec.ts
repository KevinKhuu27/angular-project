
// src/app/features/tasks/task-list/task-list.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';


import { TaskList } from './task-list';
import { Task } from '../../../models/task';
import { TaskService } from '../../../services/task.service';

// Vitest globals
import { describe, it, expect, beforeEach, vi } from 'vitest';

class MockTaskService {
  private _tasks$ = new BehaviorSubject<Task[]>([
    { id: 1, title: 'Learn Angular',  completed: false, createdAt: new Date('2025-01-01').toISOString() },
    { id: 2, title: 'Ship feature',   completed: true,  createdAt: new Date('2025-02-01').toISOString() },
    { id: 3, title: 'Refactor tests', completed: false, createdAt: new Date('2025-03-01').toISOString() },
  ]);

  tasks$ = this._tasks$.asObservable();

  add = vi.fn((title: string) => {
    const curr = this._tasks$.getValue();
    const nextId = Math.max(0, ...curr.map(t => t.id)) + 1;
    this._tasks$.next([
      ...curr,
      { id: nextId, title, completed: false, createdAt: new Date().toISOString() },
    ]);
  });

  toggle = vi.fn((id: number) => {
    const curr = this._tasks$.getValue();
    this._tasks$.next(curr.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  });

  remove = vi.fn((id: number) => {
    const curr = this._tasks$.getValue();
    this._tasks$.next(curr.filter(t => t.id !== id));
  });
}

describe('TaskList', () => {
  let fixture: ComponentFixture<TaskList>;
  let component: TaskList;
  let taskService: MockTaskService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TaskList,                 // standalone component
        RouterTestingModule,      // provides ActivatedRoute, RouterLink, etc.
      ],
      providers: [
        { provide: TaskService, useClass: MockTaskService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskList);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    fixture.detectChanges();
  });

  function getListItems(): HTMLElement[] {
    return fixture.debugElement.queryAll(By.css('ul.list > li')).map(de => de.nativeElement as HTMLElement);
  }
  function getFilterButton(name: 'All' | 'Active' | 'Completed') {
    return fixture.debugElement.query(By.css(`.filters button:nth-child(${name === 'All' ? 1 : name === 'Active' ? 2 : 3})`));
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all tasks by default (filter=all)', () => {
    const items = getListItems();
    expect(items.length).toBe(3);
    const done = items.filter(el => el.classList.contains('done'));
    expect(done.length).toBe(1);
  });

  it('should switch filters and update the view', () => {
    getFilterButton('Active').nativeElement.click();
    fixture.detectChanges();
    let items = getListItems();
    expect(items.length).toBe(2);
    expect(items.every(el => !el.classList.contains('done'))).toBe(true);

    getFilterButton('Completed').nativeElement.click();
    fixture.detectChanges();
    items = getListItems();
    expect(items.length).toBe(1);
    expect(items[0].classList.contains('done')).toBe(true);

    getFilterButton('All').nativeElement.click();
    fixture.detectChanges();
    items = getListItems();
    expect(items.length).toBe(3);
  });

  it('should set active class on the current filter button', () => {
    const allBtn = getFilterButton('All').nativeElement as HTMLButtonElement;
    const activeBtn = getFilterButton('Active').nativeElement as HTMLButtonElement;
    const completedBtn = getFilterButton('Completed').nativeElement as HTMLButtonElement;

    expect(allBtn.classList.contains('active')).toBe(true);
    expect(activeBtn.classList.contains('active')).toBe(false);
    expect(completedBtn.classList.contains('active')).toBe(false);

    activeBtn.click();
    fixture.detectChanges();
    expect(activeBtn.classList.contains('active')).toBe(true);

    completedBtn.click();
    fixture.detectChanges();
    expect(completedBtn.classList.contains('active')).toBe(true);
  });

  it('should disable the Add button when form is invalid, enable when valid', () => {
    const input = fixture.debugElement.query(By.css('input[type="text"]')).nativeElement as HTMLInputElement;
    const button = fixture.debugElement.query(By.css('form.add-row button[type="submit"]')).nativeElement as HTMLButtonElement;

    expect(button.disabled).toBe(true);

    input.value = 'a';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button.disabled).toBe(true);

    input.value = 'Do something';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  it('should call taskService.add on valid form submit and reset control', () => {
    const input = fixture.debugElement.query(By.css('input[type="text"]')).nativeElement as HTMLInputElement;
    const form = fixture.debugElement.query(By.css('form.add-row')).nativeElement as HTMLFormElement;

    input.value = ' New task ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(taskService.add).toHaveBeenCalledWith('New task');
    expect(component.addControl.value).toBeNull();
  });

  it('should not call taskService.add if value is empty or whitespace', () => {
    const input = fixture.debugElement.query(By.css('input[type="text"]')).nativeElement as HTMLInputElement;
    const form = fixture.debugElement.query(By.css('form.add-row')).nativeElement as HTMLFormElement;

    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(taskService.add).not.toHaveBeenCalled();
  });

  it('should call taskService.toggle when checkbox changes', () => {
    const firstCheckbox = fixture.debugElement.queryAll(By.css('ul.list input[type="checkbox"]'))[0]
      .nativeElement as HTMLInputElement;

    firstCheckbox.click();
    fixture.detectChanges();

    expect(taskService.toggle).toHaveBeenCalledWith(1);
  });

  it('should call taskService.remove when Delete button clicked', () => {
    const listItems = fixture.debugElement.queryAll(By.css('ul.list > li'));
    const deleteBtn = listItems[1].query(By.css('button.danger')).nativeElement as HTMLButtonElement;

    deleteBtn.click();
    fixture.detectChanges();

    expect(taskService.remove).toHaveBeenCalledWith(2);
  });

  it('should show empty state when no items for selected filter', () => {
    const listItems = fixture.debugElement.queryAll(By.css('ul.list > li'));
    const deleteBtn = listItems[1].query(By.css('button.danger')).nativeElement as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();

    getFilterButton('Completed').nativeElement.click();
    fixture.detectChanges();

    const empty = fixture.debugElement.query(By.css('p.empty'));
    expect(empty).toBeTruthy();
    expect(empty.nativeElement.textContent.trim()).toBe('No tasks for this filter.');
  });

  it('should render task title, date, and details router link', () => {
    const firstItem = fixture.debugElement.queryAll(By.css('ul.list > li'))[0];
    const titleSpan = firstItem.query(By.css('.title')).nativeElement as HTMLSpanElement;
    const dateSpan = firstItem.query(By.css('.meta')).nativeElement as HTMLSpanElement;
    const link = firstItem.query(By.css('a[routerLink]')).nativeElement as HTMLAnchorElement;

    expect(titleSpan.textContent?.trim()).toBe('Learn Angular');
    expect(dateSpan.textContent?.trim().length).toBeGreaterThan(0);

    // RouterTestingModule sets ng-reflect attribute, or href in some setups
    expect(link.getAttribute('ng-reflect-router-link') || link.getAttribute('href')).toContain('/tasks/1');
  });

  it('trackById should return t.id', () => {
    const task: Task = { id: 42, title: 'X', completed: false, createdAt: new Date().toISOString() };
    expect(component.trackById(0, task)).toBe(42);
  });
});
