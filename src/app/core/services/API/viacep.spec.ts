import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ViacepService } from './viacep.service';

describe('ViacepService', () => {
  let service: ViacepService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ViacepService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should sanitize the CEP and return the address response', () => {
    const response = {
      cep: '01001-000',
      logradouro: 'Praça da Sé',
      complemento: '',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107',
    };
    let receivedResponse: unknown;

    service.buscarCep('01001-000').subscribe((result) => {
      receivedResponse = result;
    });

    const request = httpTesting.expectOne(
      'https://viacep.com.br/ws/01001000/json/',
    );
    expect(request.request.method).toBe('GET');

    request.flush(response);

    expect(receivedResponse).toEqual(response);
  });

  it('should preserve the API error response for an invalid CEP', () => {
    const response = {
      cep: '',
      logradouro: '',
      complemento: '',
      bairro: '',
      localidade: '',
      uf: '',
      ibge: '',
      gia: '',
      ddd: '',
      siafi: '',
      erro: true,
    };
    let receivedResponse: unknown;

    service.buscarCep('00000-000').subscribe((result) => {
      receivedResponse = result;
    });

    const request = httpTesting.expectOne(
      'https://viacep.com.br/ws/00000000/json/',
    );
    request.flush(response);

    expect(receivedResponse).toEqual(response);
  });

  afterEach(() => httpTesting.verify());
});
