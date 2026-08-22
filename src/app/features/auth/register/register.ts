import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Login } from '../../../features/auth/login/login';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

  readonly piecesMenuOpen = signal(false);
  readonly mobileMenuOpen = signal(false);

  protected readonly loading = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly isSuccess = signal(false);
  protected readonly submitted = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]{3,20}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  protected async submit(): Promise<void> {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.statusMessage.set('Revise os campos destacados antes de continuar.');
      this.isSuccess.set(false);
      return;
    }

    if (this.form.controls.password.value !== this.form.controls.confirmPassword.value) {
      this.statusMessage.set('As senhas informadas precisam ser iguais.');
      this.isSuccess.set(false);
      return;
    }

    this.loading.set(true);

    try {
      const result = await this.authService.register(
        this.form.controls.name.value,
        this.form.controls.username.value,
        this.form.controls.email.value,
        this.form.controls.password.value,
      );
      this.statusMessage.set(result.message);
      this.isSuccess.set(result.success);

      if (result.success) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
        await this.router.navigateByUrl(returnUrl);
      }
    } finally {
      this.loading.set(false);
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openLogin(): void {
    this.closeMobileMenu();
    this.dialog.open(Login, {
      width: 'min(420px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
      panelClass: 'login-dialog-panel',
      autoFocus: 'input',
    });
  }
}
