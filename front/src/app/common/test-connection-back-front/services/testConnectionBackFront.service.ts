import { Injectable } from '@angular/core';
import {environment} from '../../../../environments/environment.development';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TestConnectionBackFrontService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  testFirestore() {
    return this.http.get<{message: string}>(`${this.apiUrl}/firestore/connection-info`);
  }
}
