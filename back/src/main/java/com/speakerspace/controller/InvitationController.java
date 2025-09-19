package com.speakerspace.controller;

import com.speakerspace.dto.EmailDTO;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.service.TeamMemberService;
import com.speakerspace.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class InvitationController {

    private final TeamMemberService teamMemberService;
    private final UserService userService;

    @PostMapping("/team-members/{teamId}/invite")
    public ResponseEntity<TeamMemberDTO> inviteMemberByEmail(
            @PathVariable String teamId,
            @RequestBody EmailDTO invitationDTO) throws AccessDeniedException {

        TeamMemberDTO invitedMember = teamMemberService.inviteMemberByEmail(teamId, invitationDTO.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(invitedMember);
    }

    @PostMapping("/public/invitations/process")
    public ResponseEntity<Void> processInvitation(@RequestBody EmailDTO emailDTO) {
        String email = emailDTO.email();
        String uid = emailDTO.uid();

        if (email == null || uid == null) {
            return ResponseEntity.badRequest().build();
        }

        userService.processUserLogin(email, uid);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/auth/process-invitations")
    public ResponseEntity<Void> processInvitationsAuth(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String uid = payload.get("uid");

        if (email == null || uid == null) {
            return ResponseEntity.badRequest().build();
        }

        userService.processUserLogin(email, uid);
        return ResponseEntity.ok().build();
    }
}
