import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'builds/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'components/:category',
    renderMode: RenderMode.Client,
  },
  {
    path: 'components/item/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'perfil/:username',
    renderMode: RenderMode.Client,
  },
  {
    path: 'perfil/:username/builds',
    renderMode: RenderMode.Client,
  },
  {
    path: 'build/:shareId',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
