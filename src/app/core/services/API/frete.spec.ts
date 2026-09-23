import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FreteService } from './frete.service';

describe('FreteService', () => {
  let service: FreteService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FreteService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should sanitize CEPs and send the shipping quote request', () => {
    const items = [
      {
        Height: 10,
        Length: 20,
        Width: 15,
        Weight: 2,
        Quantify: 1,
        SKU: 'GPU-1',
        Category: 'GPU',
      },
    ];
    const response = {
      ShippingPrices: [{ ShippingPrice: 25.5, ShippingTime: 4 }],
    };
    let receivedResponse: unknown;

    service
      .calcularFrete('01.234-567', '89.012-345', 1999.9, items, 'token-123')
      .subscribe((result) => (receivedResponse = result));

    const request = httpTesting.expectOne(
      'https://api.frenet.com.br/shipping/quote',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      SellerCEP: '01234567',
      RecipientCEP: '89012345',
      ShipmentInvoiceValue: 1999.9,
      ShippingItemArray: items,
    });
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(request.request.headers.get('token')).toBe('token-123');

    request.flush(response);

    expect(receivedResponse).toEqual(response);
  });

  afterEach(() => httpTesting.verify());
});
