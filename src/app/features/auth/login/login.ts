import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Signals simples para controlar estado visual da tela.
  protected readonly loading = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly isSuccess = signal(false);
  protected readonly submitted = signal(false);

  // Formulário reativo com validação de email e tamanho mínimo da senha.
  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // Tenta autenticar, mostra feedback e redireciona para a rota original.
  protected async submit(): Promise<void> {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.statusMessage.set('Revise os campos destacados antes de continuar.');
      this.isSuccess.set(false);
      return;
    }

    this.loading.set(true);

    try {
      const result = this.authService.login(this.form.controls.email.value, this.form.controls.password.value);
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
