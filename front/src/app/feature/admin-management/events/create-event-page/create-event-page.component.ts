import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-create-event-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create-event-page.component.html',
  styleUrl: './create-event-page.component.scss'
})
export class CreateEventPageComponent implements OnInit {
  teamUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.teamUrl = this.route.snapshot.paramMap.get('teamUrl') || '';
    console.log('Team URL:', this.teamUrl);
  }
}
