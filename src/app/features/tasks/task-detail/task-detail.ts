
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { map, switchMap, take } from 'rxjs/operators';
import { TaskService } from '../../../services/task.service';
import { Observable } from 'rxjs';
import { Task } from '../../../models/task';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class TaskDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private taskService = inject(TaskService);

  task$!: Observable<Task | undefined>;
  titleControl = new FormControl('', [Validators.required, Validators.minLength(2)]);

  ngOnInit() {
    this.task$ = this.route.paramMap.pipe(
      map(params => Number(params.get('id'))),
      switchMap(id => this.taskService.getById(id))
    );

    this.task$.pipe(take(1)).subscribe(task => {
      if (task) this.titleControl.setValue(task.title, { emitEvent: false });
    });
  }

  save(task: Task | undefined) {
    const t = this.titleControl.value?.trim();
    if (!task || !t) return;
    this.taskService.updateTitle(task.id, t);
    this.router.navigate(['/tasks']);
  }

  remove(task: Task | undefined) {
    if (!task) return;
    this.taskService.remove(task.id);
    this.router.navigate(['/tasks']);
  }

  toggle(task: Task | undefined) {
    if (!task) return;
    this.taskService.toggle(task.id);
  }
}
