import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DangerZoneAction, DangerZoneConfig} from '../../type/components/danger-zone';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-danger-zone',
  imports: [
    NgClass
  ],
  templateUrl: './danger-zone.component.html',
  styleUrl: './danger-zone.component.scss'
})
export class DangerZoneComponent implements OnInit {
  @Input() config!: DangerZoneConfig;
  @Input() isDeleting: boolean = false;
  @Input() currentUserRole: string = '';

  @Output() archiveAction = new EventEmitter<void>();
  @Output() deleteAction = new EventEmitter<void>();

  actions: DangerZoneAction[] = [];

  ngOnInit(): void {
    this.setupActions();
  }

  private setupActions(): void {
    this.actions = [];

    if (this.config.entityType === 'event' && this.config.showArchiveSection) {
      this.actions.push({
        id: 'archive',
        title: `Archive this ${this.config.entityType}`,
        description: this.getArchiveDescription(),
        buttonText: `Archive ${this.config.entityType}`,
        buttonIcon: 'archive',
        action: () => this.archiveAction.emit()
      });
    }

    this.actions.push({
      id: 'delete',
      title: `Delete this ${this.config.entityType}`,
      description: this.getDeleteDescription(),
      buttonText: `Delete ${this.config.entityType}`,
      buttonIcon: 'delete',
      action: () => this.deleteAction.emit()
    });
  }

  private getArchiveDescription(): string {
    return 'Archived events are not displayed anymore in the team list and in the Speaker Space search. Nothing is deleted, you can restore them when you want.';
  }

  private getDeleteDescription(): string {
    const entityName : string = this.config.entityName;
    const entityType = this.config.entityType;

    if (entityType === 'team') {
      return `This will <strong class="font-medium text-black">permanently delete the "${entityName}"</strong> team, events, speakers proposals, reviews, comments, schedule, and settings. This action cannot be undone.`;
    } else {
      return `This will <strong class="font-medium text-black">permanently delete the "${entityName}"</strong> event, speakers proposals, reviews, comments, schedule, and settings. This action cannot be undone.`;
    }
  }

  get canPerformDangerousActions(): boolean {
    return this.currentUserRole === 'Owner';
  }

  getButtonClass(): string {
    const baseClasses = 'px-4 py-1 rounded-md font-medium flex-shrink-0 border cursor-pointer flex items-center transition-colors duration-200';
      return `${baseClasses} bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400`;
  }

  getIconColor(): string {
    return 'text-red-600';
  }
}
