import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ItemFrete {
  Height: number;
  Length: number;
  Width: number;
  Weight: number;
  Quantify: number;
  SKU: string;
  Category: string;
}
export interface CotacaoFrete {
  ShippingPrice: number;
  ShippingTime: number;
  ShippingServiceCode: string;
  ShippingServiceDescription: string;
}

@Injectable({
  providedIn: 'root',
})
export class FreteService {
  private readonly apiUrl = 'https://api.frenet.com.br/shipping/quote';

  constructor(private http: HttpClient) {}

  calcularFrete(
    cepOrigem: string,
    cepDestino: string,
    valorPedido: number,
    itens: ItemFrete[],
    token: string,
  ): Observable<any> {
    const body = {
      SellerCEP: cepOrigem.replace(/\D/g, ''),
      RecipientCEP: cepDestino.replace(/\D/g, ''),
      ShipmentInvoiceValue: valorPedido,
      ShippingItemArray: itens,
    };
    const headers = new HttpHeaders({
      'Content-Type': 'appication/json',
      token: token,
    });
    return this.http.post<any>(this.apiUrl, body, { headers });
  }
}
