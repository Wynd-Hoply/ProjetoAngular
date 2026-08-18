import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals usados para refletir carregamento, mensagem e tentativa de envio.
  protected readonly loading = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly isSuccess = signal(false);
  protected readonly submitted = signal(false);

  // Formulário reativo com confirmação de senha.
  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  // Valida os campos, confere as senhas e cria a conta no localStorage.
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
      const result = this.authService.register(
        this.form.controls.name.value,
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
}
