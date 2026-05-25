import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  message: string;
  confirmLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirm</h2>
    <mat-dialog-content class="pt-2 min-w-72">
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="pb-4 pr-4 gap-2">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
