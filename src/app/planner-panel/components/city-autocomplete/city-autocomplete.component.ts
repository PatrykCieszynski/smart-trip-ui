import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Observable} from 'rxjs';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {AsyncPipe, NgForOf} from '@angular/common';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';

@Component({
  selector: 'city-autocomplete',
  imports: [
    MatLabel,
    MatFormField,
    MatAutocomplete,
    MatOption,
    AsyncPipe,
    NgForOf,
    MatAutocompleteTrigger,
    ReactiveFormsModule,
    MatInput
  ],
  templateUrl: './city-autocomplete.component.html',
  styleUrl: './city-autocomplete.component.scss'
})
export class CityAutocompleteComponent {
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() control!: FormControl<string>;
  @Input() cityOptions$!: Observable<string[]>;
  @Output() optionSelected = new EventEmitter<any>();
  @Output() blur = new EventEmitter<void>();
}

