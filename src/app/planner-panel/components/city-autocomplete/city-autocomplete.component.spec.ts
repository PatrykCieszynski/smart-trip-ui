import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CityAutocompleteComponent } from './city-autocomplete.component';

describe('CityAutocompleteComponent', () => {
  let component: CityAutocompleteComponent;
  let fixture: ComponentFixture<CityAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CityAutocompleteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CityAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
