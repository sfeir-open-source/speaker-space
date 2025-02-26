import {Component, OnInit} from '@angular/core';
import {TestConnectionBackFrontService} from './services/testConnectionBackFront.service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-test-connection-back-front',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './test-connection-back-front.component.html',
  styleUrl: './test-connection-back-front.component.scss'
})
export class TestConnectionBackFrontComponent implements OnInit {
  firestoreMessage: string = '';

  constructor(private systemInfoService: TestConnectionBackFrontService) {}

  ngOnInit() {
    this.systemInfoService.testFirestore().subscribe({
      next: (response: { message: string }) => {
        this.firestoreMessage = response.message;
      },
      error: (error) => {
        console.error('Firestore connection error :', error);
        this.firestoreMessage = 'Firestore connection error';
      }
    });
  }
}
