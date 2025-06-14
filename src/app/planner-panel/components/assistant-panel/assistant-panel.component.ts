import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked, Input } from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {AiAssistantService} from '../../../shared/service/ai-assistant/ai-assistant.service';
import {Message} from '../../../models/Message';
import {RoutePoints} from '../../../models/RoutePoints';
import {TripPlannerService} from '../../../shared/service/trip-planner/trip-planner.service';
import {Observable, tap} from 'rxjs';
import {TripResponse} from '../../../models/TripResponse';

@Component({
  selector: 'assistant-panel',
  templateUrl: './assistant-panel.component.html',
  imports: [
    MatIconButton,
    MatIcon,
    NgClass,
    NgForOf,
    FormsModule,
    MatInput,
    MatProgressSpinner,
    NgIf
  ],
  styleUrl: './assistant-panel.component.scss'
})
export class AssistantPanelComponent implements AfterViewChecked {
  @Output() closed = new EventEmitter<void>();
  @Output() opened = new EventEmitter<void>();
  @ViewChild('messages') messagesContainer!: ElementRef<HTMLDivElement>;
  @Input() history: Message[] = [];
  @Output() historyUpdate = new EventEmitter<Message[]>();

  messagesHistory: Message[] = [];
  currentMessage: string = '';
  loading: boolean = false;
  alreadyProposedAssistance: boolean = false;

  constructor(private aiAssistantService: AiAssistantService, private tripPlannerService: TripPlannerService,) {}

  ngOnInit() {
    this.messagesHistory = [...this.history];
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (!this.currentMessage.trim()) return;
    const question = this.currentMessage;
    this.messagesHistory.push({ role: 'user', content: question });
    this.historyUpdate.emit(this.messagesHistory);
    this.currentMessage = '';
    this.loading = true;

    this.aiAssistantService.askQuestion(question)
      .subscribe({
        next: (res: any) => {
          const answer = res.answer || 'Brak odpowiedzi od AI.';
          this.messagesHistory.push({ role: 'assistant', content: answer });
          this.loading = false;
        },
        error: () => {
          this.messagesHistory.push({ role: 'assistant', content: 'Błąd podczas połączenia z AI.' });
          this.loading = false;
        }
      });
  }

  close() {
    this.closed.emit();
  }

  open() {
    this.opened.emit();
  }

  proposeAssistance(routePoints: RoutePoints): Observable<TripResponse> {
    if (!this.alreadyProposedAssistance) {
      this.open();
      this.messagesHistory.push({
        role: 'assistant',
        content: 'Hej, daj mi chwilę a wzbogacę twoją podróż o parę ciekawych miejsc.'
      });
      this.loading = true;
    }

    return this.tripPlannerService.getTrip(routePoints).pipe(
      tap(res => {
        if (!this.alreadyProposedAssistance) {
          this.loading = false;
          this.messagesHistory.push({ role: 'assistant', content: res.ai.answer });
          this.alreadyProposedAssistance = true;
        }
      })
    );
  }


  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    } catch {}
  }
}
