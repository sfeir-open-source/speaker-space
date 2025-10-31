import { Injectable, signal, ElementRef } from '@angular/core';
import { FormSubmitData } from '../../type/team/form-submit-data';

@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  readonly formSubmitData = signal<FormSubmitData | undefined>(undefined);

  sendInvitation(email: string, teamName: string, teamId: string, inviterName: string, formElement?: ElementRef<HTMLFormElement>): void {
    const baseUrl = window.location.origin;
    const invitationLink = `${baseUrl}/login`;

    const message = `
    Hello,

    You have been invited by ${inviterName} to join the team "${teamName}".

    Click on this link to connect with your email: "${invitationLink}".

    Best regards,`;

    this.formSubmitData.set({
      email,
      subject: `Invitation to join "${teamName}" team on Speaker Space by ${inviterName}`,
      message,
      inviterName,
      teamName,
      invitationLink,
      autoresponse: ''
    });

    setTimeout(() => {
      formElement?.nativeElement?.submit();
    }, 100);
  }
}
