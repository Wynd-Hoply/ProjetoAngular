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

  it('deve sanitizar o CEP e retornar a resposta do endereço', () => {
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

  it('deve preservar a resposta de erro da API para um CEP inválido', () => {
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
