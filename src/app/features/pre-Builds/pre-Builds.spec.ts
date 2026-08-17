import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prebuilds } from './pre-Builds';

describe('Prebuilds', () => {
  let component: Prebuilds;
  let fixture: ComponentFixture<Prebuilds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prebuilds],
    }).compileComponents();

    fixture = TestBed.createComponent(Prebuilds);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
