import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';
  private readonly apiKey = environment.openAIApiKey

  constructor(private http: HttpClient) {
  }

  askQuestion(prompt: string) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    });

    const body = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Jesteś asystentem podróży. Pomagasz planować ciekawe trasy i punkty po drodze.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    };

    return this.http.post<any>(this.apiUrl, body, {headers});
  }
}
