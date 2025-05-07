import {
  SettingTeamMembersPageComponent
} from '../settings/setting-team-members-page/setting-team-members-page.component';

export type Team = {
  id?: string;
  name: string;
  url?: string;
  userCreateId?: string;
  memberIds?: string[];
  members?: SettingTeamMembersPageComponent[];
};
