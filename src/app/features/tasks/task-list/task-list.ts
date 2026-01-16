
import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TaskService } from '../../../services/task.service';
import { Task } from '../../../models/task';

type Filter = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './task-list.html',
  styleUrls: ['./task-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskList {
  private taskService = inject(TaskService);

  addControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  filter = signal<Filter>('all');

  tasks = toSignal(this.taskService.tasks$, { initialValue: [] as Task[] });

  filtered = computed(() => {
    const list = this.tasks();
    const f = this.filter();
    return list.filter(t =>
      f === 'active' ? !t.completed : f === 'completed' ? t.completed : true
    );
  });

  add() {
    const value = (this.addControl.value ?? '').trim();
    if (!value) return;
    this.taskService.add(value);
    this.addControl.reset();
  }

  onSubmit(ev: Event) {
    this.add();
  }
  
  toggle(id: number) { this.taskService.toggle(id); }
  remove(id: number) { this.taskService.remove(id); }
  trackById(_: number, t: Task) { return t.id; }
}
