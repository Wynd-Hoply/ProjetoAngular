# Testes de Formulário Dinâmico com Angular Testing Library

## 📋 Resumo

Este documento contém um guia completo para criar testes de **formulário dinâmico** usando Angular Testing Library (Vitest + Testing Library).

O arquivo `register.spec.ts` já foi criado com **25 testes** cobrindo os seguintes cenários:

### ✅ Testes Incluídos

#### 1. **Renderização do Formulário**
- Verificar se todos os 5 campos (nome, username, email, senha, confirmação) são renderizados
- Validar tipos de input (text, email, password)
- Verificar botão submit e link de login

#### 2. **Validação Dinâmica de Campos**
- **Nome**: Mínimo 3 caracteres
- **Username**: Padrão regex (letras, números, underscore, 3-20 chars)
- **Email**: Validação de email
- **Senha**: Mínimo 6 caracteres
- **Confirmação**: Campo obrigatório

#### 3. **Estado Completo do Formulário**
- Formulário inválido quando um campo está vazio
- Formulário válido apenas quando todos os campos preenchidos

#### 4. **Feedback de Validação**
- Estados `touched` (para mostrar erros)
- Estados `dirty` (para rastrear alterações)

#### 5. **Submit do Formulário**
- Não submeter formulário inválido
- Chamar AuthService com dados válidos
- Validar correspondência de senhas

#### 6. **Integração com AuthService**
- Exibir mensagem de sucesso
- Exibir mensagem de erro do serviço

#### 7. **Estados Dinâmicos de Loading**
- Ativar loading durante submit
- Alterar texto do botão ("Criar conta" → "Criando...")

#### 8. **Feedback Visual com Signals**
- Exibir/ocultar mensagem de status
- Aplicar classe CSS de sucesso/erro

---

## 🚀 Como Executar os Testes

### Opção 1: Vitest (Recomendado para Angular 21+)

```bash
# Executar todos os testes
npm test

# Executar apenas o spec do Register
npx vitest src/app/features/auth/register/register.spec.ts

# Modo watch (reroda ao salvar)
npx vitest --watch

# Com cobertura
npx vitest --coverage
```

### Opção 2: Angular CLI (Karma/Jasmine)

Se ainda usar o setup padrão do Angular:

```bash
ng test --include='**/register.spec.ts'
```

---

## 🔧 Estrutura do Teste

### Setup (beforeEach)

```typescript
beforeEach(async () => {
  // 1. Mock do AuthService
  authServiceMock = { register: vi.fn() };

  // 2. Configurar TestBed
  await TestBed.configureTestingModule({
    imports: [Register],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: authServiceMock },
    ],
  }).compileComponents();

  // 3. Criar componente e detectar mudanças
  fixture = TestBed.createComponent(Register);
  component = fixture.componentInstance;
  fixture.detectChanges();
});
```

---

## 🧪 Padrões de Teste Comuns

### 1. Testar Validação de Campos

```typescript
it('deve validar nome com 3+ caracteres', () => {
  const control = component.form.controls.name;
  
  control.setValue('ab');  // < 3 chars
  expect(control.invalid).toBe(true);
  
  control.setValue('João');  // >= 3 chars
  expect(control.valid).toBe(true);
});
```

### 2. Testar Submit com Mock

```typescript
it('deve chamar authService com dados válidos', async () => {
  authServiceMock.register.mockResolvedValue({
    success: true,
    message: 'Sucesso',
  });

  // Preencher formulário
  component.form.controls.name.setValue('João Silva');
  component.form.controls.username.setValue('joao_silva');
  component.form.controls.email.setValue('joao@email.com');
  component.form.controls.password.setValue('senha123');
  component.form.controls.confirmPassword.setValue('senha123');

  // Submeter
  await component.submit();

  // Verificar chamada ao serviço
  expect(authServiceMock.register).toHaveBeenCalledWith(
    'João Silva',
    'joao_silva',
    'joao@email.com',
    'senha123'
  );
});
```

### 3. Testar Estado de Loading

```typescript
it('deve ativar loading durante submit', async () => {
  authServiceMock.register.mockImplementation(
    () => new Promise(resolve => 
      setTimeout(() => resolve({ success: true, message: 'OK' }), 50)
    )
  );

  // ... preparar form ...

  component.submit();
  fixture.detectChanges();

  expect(component.loading()).toBe(true);

  // Aguardar promise
  await new Promise(resolve => setTimeout(resolve, 100));
  fixture.detectChanges();

  expect(component.loading()).toBe(false);
});
```

### 4. Testar Feedback Visual com Signals

```typescript
it('deve aplicar classe de sucesso', () => {
  component.statusMessage.set('Sucesso!');
  component.isSuccess.set(true);
  fixture.detectChanges();

  const feedback = fixture.nativeElement.querySelector('.auth-feedback');
  expect(feedback.classList.contains('auth-feedback--success')).toBe(true);
});
```

---

## 📦 Dependências Necessárias

### Já Instaladas

```json
{
  "@angular/core": "^21.2.0",
  "@angular/forms": "^21.2.0",
  "@angular/router": "^21.2.0",
  "vitest": "^4.1.11",
  "@testing-library/angular": "latest"
}
```

### Se Usando Jasmine/Karma

```json
{
  "@angular/cli": "^21.2.19",
  "karma": "^6.x",
  "karma-jasmine": "^5.x",
  "jasmine-core": "^4.x"
}
```

---

## 🎯 Boas Práticas para Testes de Formulário

### ✅ DO

1. **Testar lógica, não implementação**
   ```typescript
   // ✅ BOM
   expect(component.form.valid).toBe(true);
   ```

2. **Usar signals corretamente**
   ```typescript
   // ✅ BOM - testar o valor atual
   expect(component.loading()).toBe(false);
   ```

3. **Mock serviços externos**
   ```typescript
   // ✅ BOM - não chamará HTTP real
   authServiceMock.register.mockResolvedValue(...);
   ```

4. **Testar múltiplos cenários**
   ```typescript
   // ✅ BOM - testa inválido e válido
   control.setValue('ab'); // inválido
   control.setValue('João'); // válido
   ```

### ❌ DON'T

1. **Não testar implementação do framework**
   ```typescript
   // ❌ RUIM
   expect(component.form.controls.name.status).toBe('INVALID');
   ```

2. **Não deixar dependências de tempo não controladas**
   ```typescript
   // ❌ RUIM
   setTimeout(() => { /* teste */ }, 5000);
   
   // ✅ BOM
   await new Promise(resolve => setTimeout(resolve, 100));
   ```

3. **Não testar CSS diretamente**
   ```typescript
   // ❌ RUIM
   expect(element.style.color).toBe('red');
   
   // ✅ BOM
   expect(element.classList.contains('error-class')).toBe(true);
   ```

---

## 🔍 Exemplo Completo de Teste

```typescript
describe('Validação e Submit', () => {
  it('deve submeter formulário válido e exibir sucesso', async () => {
    // Arrange (preparar)
    authServiceMock.register.mockResolvedValue({
      success: true,
      message: 'Cadastro realizado!',
    });

    // Act (agir)
    component.form.controls.name.setValue('João Silva');
    component.form.controls.username.setValue('joao_silva');
    component.form.controls.email.setValue('joao@email.com');
    component.form.controls.password.setValue('senha123');
    component.form.controls.confirmPassword.setValue('senha123');

    await component.submit();
    fixture.detectChanges();

    // Assert (verificar)
    expect(component.statusMessage()).toBe('Cadastro realizado!');
    expect(component.isSuccess()).toBe(true);
    expect(authServiceMock.register).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📊 Cobertura de Testes Esperada

| Área | Testes | Cobertura |
|------|--------|-----------|
| Renderização | 3 | 100% |
| Validação | 6 | 100% |
| Estado Formulário | 2 | 100% |
| Submit | 3 | 100% |
| AuthService | 2 | 100% |
| Loading | 2 | 100% |
| Feedback Visual | 3 | 100% |
| Rastreamento | 1 | 100% |
| **TOTAL** | **25** | **100%** |

---

## 🐛 Troubleshooting

### Erro: "Need to call TestBed.initTestEnvironment() first"

**Solução**: Certifique-se de que `vitest.setup.ts` está configurado:

```typescript
// vitest.setup.ts
import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
```

### Erro: "Component 'Register' is not resolved"

**Solução**: Adicione `.compileComponents()`:

```typescript
await TestBed.configureTestingModule({...}).compileComponents();
```

### Erro: Testes lentos

**Solução**: Use `detectChanges()` seletivamente e evite `waitFor()` desnecessários.

---

## 📚 Referências

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/angular-testing-library/intro/)
- [Formulários Reativos Angular](https://angular.io/guide/reactive-forms)

---

## 💡 Próximos Passos

1. ✅ Executar `npm test` para verificar testes
2. ✅ Adicionar cobertura com `npx vitest --coverage`
3. ✅ Estender testes para outras páginas de autenticação (Login, ForgotPassword)
4. ✅ Integrar no CI/CD pipeline

---

**Criado em**: 17 de Setembro de 2026  
**Framework**: Angular 21 + Vitest + Testing Library
