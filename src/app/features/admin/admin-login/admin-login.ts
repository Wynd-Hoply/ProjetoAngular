import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AdminService } from '../../../core/services/admin';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLogin {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly submitted = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.statusMessage.set('Informe usuário e senha.');
      return;
    }

    this.loading.set(true);
    try {
      const result = await this.adminService.login(
        this.form.controls.username.value,
        this.form.controls.password.value,
      );
      this.statusMessage.set(result.message);
      if (result.success) {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin';
        await this.router.navigateByUrl(returnUrl);
      }
    } finally {
      this.loading.set(false);
    }
  }
}
