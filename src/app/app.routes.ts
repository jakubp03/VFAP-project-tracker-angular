import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-board/project-board.component').then(
            m => m.ProjectBoardComponent
          )
      },
      {
        path: 'projects/:projectId',
        loadComponent: () =>
          import('./features/projects/project-view/project-view.component').then(
            m => m.ProjectViewComponent
          )
      },
      {
        path: 'projects/:projectId/tasks/:taskId',
        loadComponent: () =>
          import('./features/tasks/task-view/task-view.component').then(
            m => m.TaskViewComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: 'projects' }
];
