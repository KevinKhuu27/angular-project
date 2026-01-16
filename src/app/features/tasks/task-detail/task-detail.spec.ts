
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TaskDetail } from './task-detail';
import { describe, it, expect, beforeEach } from 'vitest';

describe('TaskDetail', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TaskDetail,
        RouterTestingModule,  // <-- satisfies ActivatedRoute and router directives
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TaskDetail);
    const cmp = fixture.componentInstance;
    expect(cmp).toBeTruthy();
  });
});
``
