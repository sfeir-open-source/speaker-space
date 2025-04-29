package com.speakerspace.controller;

import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.service.TeamMemberService;
import com.speakerspace.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/team-members")
public class TeamMemberController {

    private static final Logger logger = LoggerFactory.getLogger(TeamMemberController.class);

        private final UserService userService;
    private final TeamMemberService teamMemberService;

    public TeamMemberController(UserService userService, TeamMemberService teamMemberService) {
        this.userService = userService;
        this.teamMemberService = teamMemberService;
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<List<TeamMemberDTO>> getTeamMembers(@PathVariable String teamId) {
        try {
            List<TeamMemberDTO> members = teamMemberService.getTeamMembers(teamId);
            return ResponseEntity.ok(members);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<TeamMemberDTO> addTeamMember(
            @PathVariable String teamId,
            @RequestBody TeamMemberDTO memberDTO) {
        try {
            TeamMemberDTO addedMember = teamMemberService.addTeamMember(teamId, memberDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(addedMember);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{teamId}/members/{userId}")
    public ResponseEntity<TeamMemberDTO> updateTeamMemberRole(
            @PathVariable String teamId,
            @PathVariable String userId,
            @RequestBody TeamMemberDTO memberDTO) {
        try {
            TeamMemberDTO updatedMember = teamMemberService.updateTeamMemberRole(teamId, userId, memberDTO.getRole());
            return ResponseEntity.ok(updatedMember);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<Void> removeTeamMember(
            @PathVariable String teamId,
            @PathVariable String userId) {
        try {
            boolean removed = teamMemberService.removeTeamMember(teamId, userId);
            return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<TeamMemberDTO>> searchUsersByEmail(@RequestParam String email) {
        if (email == null || email.length() < 2) {
            return ResponseEntity.badRequest().build();
        }

        try {
            List<TeamMemberDTO> users = userService.searchUsersByEmail(email);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
