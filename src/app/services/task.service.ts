
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Task } from '../models/task';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly storageKey = 'tasks.v1';
  private readonly tasksSubject = new BehaviorSubject<Task[]>(this.load());
  readonly tasks$ = this.tasksSubject.asObservable();

  private load(): Task[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? (JSON.parse(raw) as Task[]) : [];
    } catch {
      return [];
    }
  }
    
  private save(list: Task[]) {
    try {
      console.log('[TaskService.save] writing', list);
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      this.tasksSubject.next(list);
    } catch (e) {
      console.error('[TaskService.save] failed', e);
    }
  }

  add(title: string): void {
    console.log('[TaskService.add] title=', title);
    const now = new Date().toISOString();
    const list = this.tasksSubject.getValue();
    const nextId = list.length ? Math.max(...list.map(t => t.id)) + 1 : 1;
    const task: Task = { id: nextId, title: title.trim(), completed: false, createdAt: now };
    this.save([task, ...list]);
  }

  toggle(id: number): void {
    const list = this.tasksSubject.getValue().map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    this.save(list);
  }

  remove(id: number): void {
    const list = this.tasksSubject.getValue().filter(t => t.id !== id);
    this.save(list);
  }

  updateTitle(id: number, title: string): void {
    const list = this.tasksSubject.getValue().map(t =>
      t.id === id ? { ...t, title: title.trim() } : t
    );
    this.save(list);
  }

  getById(id: number): Observable<Task | undefined> {
    return this.tasks$.pipe(map(list => list.find(t => t.id === id)));
  }
}
