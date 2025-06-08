import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssistantPanelComponent } from './assistant-panel.component';

describe('AssistantPanelComponent', () => {
  let component: AssistantPanelComponent;
  let fixture: ComponentFixture<AssistantPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssistantPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
