import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatDialogModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogRef = inject(MatDialogRef<Login>, { optional: true });

  protected readonly loading = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly isSuccess = signal(false);
  protected readonly submitted = signal(false);

  // Aceita email OU nome de usuário no mesmo campo.
  protected readonly form = this.formBuilder.nonNullable.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected async submit(): Promise<void> {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.statusMessage.set('Revise os campos destacados antes de continuar.');
      this.isSuccess.set(false);
      return;
    }

    this.loading.set(true);

    try {
      const result = await this.authService.login(this.form.controls.identifier.value, this.form.controls.password.value);
      this.statusMessage.set(result.message);
      this.isSuccess.set(result.success);

      if (result.success) {
        this.dialogRef?.close();
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        await this.router.navigateByUrl(returnUrl);
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected close(): void {
    this.dialogRef?.close();
  }
}