package com.speakerspace.controller;

import com.speakerspace.dto.EmailDTO;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.service.TeamMemberService;
import com.speakerspace.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.Map;

@Slf4j
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
    public ResponseEntity<Map<String, Object>> processInvitation(@RequestBody EmailDTO emailDTO) {
        String email = emailDTO.email();
        String uid = emailDTO.uid();

        if (email == null || email.isBlank() || uid == null || uid.isBlank()) {
            log.warn("Invalid request: email or uid is missing");
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and UID are required"));
        }

        try {
            userService.processUserLogin(email, uid);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Invitations processed successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "success", false,
                            "error", e.getMessage()
                    ));
        }
    }

    @Deprecated
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
