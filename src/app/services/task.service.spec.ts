
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from './task.service';
import type { Task } from '../models/task';

// --- Simple in-memory localStorage mock ---
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    // Helper to inspect internal store in tests
    _dump: () => ({ ...store }),
    _seed: (key: string, value: unknown) => {
      store[key] = JSON.stringify(value);
    },
  };
}

const STORAGE_KEY = 'tasks.v1';

describe('TaskService', () => {
  let ls: ReturnType<typeof createLocalStorageMock>;
  let service: TaskService;

  // Helper: read the current list from the observable (BehaviorSubject sync emission)
  function readTasks(): Task[] {
    let latest: Task[] = [];
    const sub = service.tasks$.subscribe(v => (latest = v));
    sub.unsubscribe();
    return latest;
  }

  function readStorage(): Task[] {
    const raw = ls.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  }


  beforeEach(() => {
    vi.restoreAllMocks();
    ls = createLocalStorageMock();

    // Replace global localStorage with our in-memory mock
    vi.stubGlobal('localStorage', ls as unknown as Storage);

    service = new TaskService();
  });


  it('should load empty list when storage is empty', () => {
    // Fresh service already constructed with empty storage
    const tasks = readTasks();
    expect(tasks).toEqual([]);
    expect(ls.getItem).toHaveBeenCalledWith(STORAGE_KEY);
  });

  it('should load existing tasks from storage at startup', () => {
    // Seed storage before creating the service
    const seeded: Task[] = [
      { id: 10, title: 'Seed A', completed: false, createdAt: new Date('2024-01-01').toISOString() },
      { id: 11, title: 'Seed B', completed: true,  createdAt: new Date('2024-02-01').toISOString() },
    ];
    ls._seed(STORAGE_KEY, seeded);

    // Recreate service to read from seeded storage
    service = new TaskService();
    const tasks = readTasks();

    expect(tasks).toEqual(seeded);
  });

  it('add() should trim title, set ISO createdAt, completed=false, prepend, persist, and increment id', () => {
    const before = readTasks();
    expect(before).toEqual([]);

    service.add('  New task  ');

    const after = readTasks();
    expect(after.length).toBe(1);
    const t = after[0];
    expect(t.title).toBe('New task');
    expect(t.completed).toBe(false);
    expect(typeof t.createdAt).toBe('string');
    // createdAt should be parseable ISO date
    expect(Number.isNaN(Date.parse(t.createdAt))).toBe(false);
    expect(t.id).toBe(1);

    // Add another to ensure increment and prepend order
    service.add('Second');
    const after2 = readTasks();
    expect(after2.length).toBe(2);
    expect(after2[0].title).toBe('Second');
    expect(after2[0].id).toBe(2);
    expect(after2[1].title).toBe('New task');

    // Persists to storage
    const persisted = readStorage();
    expect(persisted.length).toBe(2);
    expect(persisted[0].title).toBe('Second');
  });

  it('toggle() should flip completed and persist', () => {
    service.add('Task');
    let list = readTasks();
    const id = list[0].id;
    expect(list[0].completed).toBe(false);

    service.toggle(id);
    list = readTasks();
    expect(list[0].completed).toBe(true);

    service.toggle(id);
    list = readTasks();
    expect(list[0].completed).toBe(false);

    // Persisted
    const persisted = readStorage();
    expect(persisted[0].completed).toBe(false);
  });

  it('remove() should delete by id and persist', () => {
    service.add('A');
    service.add('B');
    let list = readTasks();
    expect(list.map(t => t.title)).toEqual(['B', 'A']);

    const removeId = list[0].id; // id of 'B'
    service.remove(removeId);

    list = readTasks();
    expect(list.map(t => t.title)).toEqual(['A']);

    const persisted = readStorage();
    expect(persisted.map(t => t.title)).toEqual(['A']);
  });

  it('updateTitle() should trim and update title by id, persist', () => {
    service.add('Old Title');
    let list = readTasks();
    const id = list[0].id;

    service.updateTitle(id, '  New Title  ');
    list = readTasks();

    expect(list[0].title).toBe('New Title');

    const persisted = readStorage();
    expect(persisted[0].title).toBe('New Title');
  });

  it('getById() should emit the correct task and undefined for missing id', async () => {
    service.add('X');
    service.add('Y');

    // Snapshot approach (BehaviorSubject)
    const list = readTasks();
    const idY = list.find(t => t.title === 'Y')!.id;

    // Subscribe and take the current value
    let value: Task | undefined;
    const sub = service.getById(idY).subscribe(v => (value = v));
    sub.unsubscribe();

    expect(value?.title).toBe('Y');

    // Missing id
    let missing: Task | undefined;
    const sub2 = service.getById(999).subscribe(v => (missing = v));
    sub2.unsubscribe();

    expect(missing).toBeUndefined();
  });

  it('add() should compute next id as max+1 even with gaps', () => {
    // Seed storage with ids [1,3] to create a gap
    const seeded: Task[] = [
      { id: 1, title: 'A', completed: false, createdAt: new Date('2024-01-01').toISOString() },
      { id: 3, title: 'C', completed: false, createdAt: new Date('2024-01-03').toISOString() },
    ];
    ls._seed(STORAGE_KEY, seeded);
    service = new TaskService();

    service.add('B'); // should get id=4 (max+1)
    const list = readTasks();
    expect(list[0].id).toBe(4);
    expect(list[0].title).toBe('B');
  });
});
