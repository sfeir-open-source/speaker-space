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
  userRoleResult: any = null;
  adminRoleResult: any = null;
  roleError: string = '';

  constructor(
    private systemInfoService: TestConnectionBackFrontService,
  ) {}

  ngOnInit() {
    this.systemInfoService.testFirestore().subscribe({
      next: (response: { message: string }) => {
        this.firestoreMessage = response.message;
      },
      error: (error) => {
        console.error('Firestore connection error:', error);
        this.firestoreMessage = 'Firestore connection error';
      }
    });
  }


  testUserRole() {
    this.roleError = '';
    this.systemInfoService.testUserAccess().subscribe({
      next: (result) => {
        this.userRoleResult = result;
      },
      error: (error) => {
        console.error('User role test failed:', error);
        this.roleError = `User role test failed: ${error.status} ${error.statusText}`;
        if (error.error) {
          this.roleError += `\n${JSON.stringify(error.error)}`;
        }
      }
    });
  }

  testAdminRole() {
    this.roleError = '';
    this.systemInfoService.testAdminAccess().subscribe({
      next: (result) => {
        this.adminRoleResult = result;
      },
      error: (error) => {
        console.error('Admin role test failed:', error);
        this.roleError = `Admin role test failed: ${error.status} ${error.statusText}`;
        if (error.error) {
          this.roleError += `\n${JSON.stringify(error.error)}`;
        }
      }
    });
  }
}
