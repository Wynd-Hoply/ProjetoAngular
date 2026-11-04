import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//Payload Response de ViaCEP API
export interface Endereco {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ViacepService {

  private readonly apiUrl = 'https://viacep.com.br/ws';

  constructor(private http: HttpClient) {}

  buscarCep(cep: string): Observable<Endereco> {
    const cepLimpo = cep.replace(/\D/g, '');

    //path param para o endpoint da API para buscar informações de endereço com base no CEP (código postal) fornecido
    return this.http.get<Endereco>(
      `${this.apiUrl}/${cepLimpo}/json/`
    );
  }
}