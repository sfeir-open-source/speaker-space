import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import { NavbarTeamPageComponent } from '../../components/navbar-team-page/navbar-team-page.component';
import { EventTeamCardComponent } from '../../../../shared/event-team-card/event-team-card.component';
import { EventTeamField } from '../../../../shared/event-team-card/interface/event-team-field';
import { switchMap } from 'rxjs/operators';
import {TeamService} from '../../services/team.service';
import {ButtonGreyComponent} from '../../../../shared/button-grey/button-grey.component';

@Component({
  selector: 'app-team-event-page',
  imports: [
    CommonModule,
    EventTeamCardComponent,
    NavbarTeamPageComponent,
    ButtonGreyComponent,
  ],
  templateUrl: './team-event-page.component.html',
  styleUrl: './team-event-page.component.scss'
})
export class TeamEventPageComponent implements OnInit {
  activeTab: string = 'Active';
  teamUrl: string = '';
  teamId: string = '';
  teamName: string = '';
  formFields: EventTeamField[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private teamService: TeamService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.teamUrl = params.get('teamUrl') || '';
        this.isLoading = true;
        return this.teamService.getTeamByUrl(this.teamUrl);
      })
    ).subscribe({
      next: (team) => {
        this.teamName = team.name;
        this.teamId = team.id ?? '';
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load team details';
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  addEvent() {
    if (this.teamUrl) {
      this.router.navigate(['/create-event', this.teamUrl]);
    } else if (this.teamId) {
      this.router.navigate(['/create-event', this.teamId]);
    }
  }
}
