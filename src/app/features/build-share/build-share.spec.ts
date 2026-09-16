import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BuildShare } from './build-share';

describe('BuildShare', () => {
  let component: BuildShare;
  let fixture: ComponentFixture<BuildShare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildShare],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BuildShare);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
