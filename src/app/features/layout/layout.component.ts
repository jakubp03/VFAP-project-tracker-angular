import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="flex h-screen overflow-hidden">
      <app-sidebar />
      <main class="flex-1 overflow-y-auto bg-gray-100 p-6">
        <router-outlet />
      </main>
    </div>
  `
})
export class LayoutComponent {}
