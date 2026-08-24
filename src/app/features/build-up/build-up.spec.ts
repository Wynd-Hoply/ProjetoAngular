import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BuildUp } from './build-up';

describe('BuildUp', () => {
  let component: BuildUp;
  let fixture: ComponentFixture<BuildUp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildUp],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BuildUp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
