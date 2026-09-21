import { TestBed } from '@angular/core/testing';

import { ViacepService } from './viacep.service';

describe('Viacep', () => {
  let service: ViacepService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViacepService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
