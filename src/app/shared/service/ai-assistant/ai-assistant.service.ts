import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly AIUrl = '/api/v1/ai/';

  constructor(private http: HttpClient) {
  }

  askQuestion(prompt: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<any>(this.AIUrl + 'ask', JSON.stringify(prompt), httpOptions).pipe(
      tap(response => console.log('AI response: ', response)),
    );
  }
}
