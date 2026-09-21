import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme';

describe('Theme', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });
});
