import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'tasks', renderMode: RenderMode.Prerender },
  { path: 'tasks/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];
