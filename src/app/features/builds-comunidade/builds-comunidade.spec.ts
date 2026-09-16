import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BuildsComunidade } from './builds-comunidade';

describe('BuildsComunidade', () => {
  let component: BuildsComunidade;
  let fixture: ComponentFixture<BuildsComunidade>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildsComunidade],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BuildsComunidade);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
