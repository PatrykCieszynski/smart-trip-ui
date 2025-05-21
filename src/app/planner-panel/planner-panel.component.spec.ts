import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlannerPanelComponent } from './planner-panel.component';

describe('PlannerPanelComponent', () => {
  let component: PlannerPanelComponent;
  let fixture: ComponentFixture<PlannerPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlannerPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlannerPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
