import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleMappingValidationComponent } from './schedule-mapping-validation.component';

describe('ScheduleMappingValidationComponent', () => {
  let component: ScheduleMappingValidationComponent;
  let fixture: ComponentFixture<ScheduleMappingValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleMappingValidationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleMappingValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
