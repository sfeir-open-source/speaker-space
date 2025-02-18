import { Component } from '@angular/core';
import {TestConnectionBackFrontService} from './services/testConnectionBackFront.service';

@Component({
  selector: 'app-test-connection-back-front',
  imports: [],
  templateUrl: './test-connection-back-front.component.html',
  standalone: true,
  styleUrl: './test-connection-back-front.component.scss'
})
export class TestConnectionBackFrontComponent {

  message: string = '';

  constructor(private apiService: TestConnectionBackFrontService) {}

  ngOnInit() {
    this.testConnection();
  }

  testConnection() {
    this.apiService.testConnection().subscribe({
      next: (response) => {
        this.message = response;
        console.log('Connection successful:', response);
      },
      error: (error) => {
        console.error('Connection failed:', error);
      }
    });
  }
}
