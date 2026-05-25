import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatDividerModule, MatTooltipModule],
  template: `
    <aside class="w-60 h-full flex flex-col shrink-0">
      <!-- User info -->
      <div class="px-4 py-4 flex items-center gap-3">
        <mat-icon class="text-gray-400">account_circle</mat-icon>
        <div class="overflow-hidden">
          <p class="text-sm font-medium truncate">{{ user().name ?? user().email ?? 'User' }}</p>
          <p class="text-xs truncate">{{ user().email }}</p>
        </div>
      </div>

      <mat-divider class="border-gray-700" />

      <!-- Navigation -->
      <nav class="flex-1 px-2 py-4 flex flex-col gap-1">
        <a
          routerLink="/projects"
          class="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-gray-700 hover:text-white transition-colors no-underline"
        >
          <mat-icon class="!text-base !h-5 !w-5">folder</mat-icon>
          Projects
        </a>
      </nav>

      <mat-divider class="border-gray-700" />

      <!-- Logout -->
      <div class="px-2 py-4">
        <button
          mat-stroked-button
          class="w-full flex items-center "
          (click)="logout()"
        >
          <mat-icon class="!text-base !h-5 !w-5">logout</mat-icon>
          Logout
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.authService.user;

  logout(): void {
    this.authService.logout();
  }
}
