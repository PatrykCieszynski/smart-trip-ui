import { Component } from '@angular/core';
import {AiAssistantService} from '../../../shared/service/ai-assistant/ai-assistant.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'assistant-panel',
  imports: [
    NgIf
  ],
  templateUrl: './assistant-panel.component.html',
  styleUrl: './assistant-panel.component.scss'
})
export class AssistantPanelComponent {
  answer = '';

  constructor(private aiAssistantService: AiAssistantService) {}

  ask() {
    this.aiAssistantService.askQuestion('Jaką trasę polecasz z Wrocławia do Krakowa?')
      .subscribe({
        next: (res) => {
          this.answer = res.choices[0].message.content;
        },
        error: (err) => {
          console.error(err);
          this.answer = 'Błąd podczas połączenia z AI.';
        }
      });
  }
}
