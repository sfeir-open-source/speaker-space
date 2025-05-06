package com.speakerspace.controller;

import com.speakerspace.dto.EmailDTO;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.service.TeamMemberService;
import com.speakerspace.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.Map;

@RestController
public class InvitationController {

    private final TeamMemberService teamMemberService;
    private final UserService userService;
    private static final Logger logger = LoggerFactory.getLogger(InvitationController.class);

    @Autowired
    public InvitationController(TeamMemberService teamMemberService, UserService userService) {
        this.teamMemberService = teamMemberService;
        this.userService = userService;
    }

    @PostMapping("/team-members/{teamId}/invite")
    public ResponseEntity<TeamMemberDTO> inviteMemberByEmail(
            @PathVariable String teamId,
            @RequestBody EmailDTO invitationDTO) {
        try {
            TeamMemberDTO invitedMember = teamMemberService.inviteMemberByEmail(teamId, invitationDTO.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(invitedMember);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/public/invitations/process")
    public ResponseEntity<Void> processInvitation(@RequestBody EmailDTO emailDTO) {
        try {
            String email = emailDTO.getEmail();
            String uid = emailDTO.getUid();

            if (email == null || uid == null) {
                return ResponseEntity.badRequest().build();
            }

            userService.processUserLogin(email, uid);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/auth/process-invitations")
    public ResponseEntity<Void> processInvitationsAuth(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String uid = payload.get("uid");

            if (email == null || uid == null) {
                return ResponseEntity.badRequest().build();
            }

            userService.processUserLogin(email, uid);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error processing invitations from auth endpoint", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}