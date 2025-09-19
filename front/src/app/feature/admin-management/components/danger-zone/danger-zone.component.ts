import { Component, input, output, computed } from '@angular/core';
import { DangerZoneAction, DangerZoneConfig } from '../../type/components/danger-zone';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-danger-zone',
  imports: [
    NgClass
  ],
  templateUrl: './danger-zone.component.html',
  styleUrl: './danger-zone.component.scss'
})
export class DangerZoneComponent {
  config = input.required<DangerZoneConfig>();
  isDeleting = input<boolean>(false);
  currentUserRole = input<string>('');

  archiveAction = output<void>();
  deleteAction = output<void>();

  readonly actions = computed<DangerZoneAction[]>(() => {
    const currentConfig = this.config();
    const actions: DangerZoneAction[] = [];

    if (currentConfig.entityType === 'event' && currentConfig.showArchiveSection) {
      actions.push({
        id: 'archive',
        title: `Archive this ${currentConfig.entityType}`,
        description: this.getArchiveDescription(),
        buttonText: `Archive ${currentConfig.entityType}`,
        buttonIcon: 'archive',
        action: () => this.archiveAction.emit()
      });
    }

    actions.push({
      id: 'delete',
      title: `Delete this ${currentConfig.entityType}`,
      description: this.getDeleteDescription(),
      buttonText: `Delete ${currentConfig.entityType}`,
      buttonIcon: 'delete',
      action: () => this.deleteAction.emit()
    });

    return actions;
  });

  readonly canPerformDangerousActions = computed<boolean>(() =>
    this.currentUserRole() === 'Owner'
  );

  private getArchiveDescription(): string {
    return 'Archived events are not displayed anymore in the team list and in the Speaker Space search. Nothing is deleted, you can restore them when you want.';
  }

  private getDeleteDescription(): string {
    const currentConfig = this.config();
    const entityName = currentConfig.entityName;
    const entityType = currentConfig.entityType;

    if (entityType === 'team') {
      return `This will <strong class="font-medium text-black">permanently delete the "${entityName}"</strong> team, events, speakers proposals, reviews, comments, schedule, and settings. This action cannot be undone.`;
    } else {
      return `This will <strong class="font-medium text-black">permanently delete the "${entityName}"</strong> event, speakers proposals, reviews, comments, schedule, and settings. This action cannot be undone.`;
    }
  }

  getButtonClass(): string {
    const baseClasses = 'px-4 py-1 rounded-md font-medium flex-shrink-0 border cursor-pointer flex items-center transition-colors duration-200';
    return `${baseClasses} bg-white hover:bg-red-50 text-red-600 border-red-300 hover:border-red-400`;
  }

  getIconColor(): string {
    return 'text-red-600';
  }
}
