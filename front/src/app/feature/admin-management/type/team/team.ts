import {TeamMember} from './team-member';

export type Team = {
  id?: string;
  name: string;
  url?: string;
  userCreateId?: string;
  memberIds?: string[];
  members?: TeamMember[];
};
