package com.speakerspace.controller;

import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.service.TeamMemberService;
import com.speakerspace.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/team-members")
@RequiredArgsConstructor
public class TeamMemberController {

    private final UserService userService;
    private final TeamMemberService teamMemberService;

    @PostMapping("/{teamId}/members")
    public ResponseEntity<TeamMemberDTO> addTeamMember(
            @PathVariable String teamId,
            @RequestBody TeamMemberDTO memberDTO) throws AccessDeniedException {

        TeamMemberDTO addedMember = teamMemberService.addTeamMember(teamId, memberDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(addedMember);
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<List<TeamMemberDTO>> getTeamMembers(@PathVariable String teamId) throws AccessDeniedException {
        List<TeamMemberDTO> members = teamMemberService.getTeamMembers(teamId);
        return ResponseEntity.ok(members);
    }

    @GetMapping("/search")
    public ResponseEntity<List<TeamMemberDTO>> searchUsersByEmail(@RequestParam String email) {
        if (email == null || email.length() < 2) {
            throw new IllegalArgumentException("Email must be at least 2 characters long");
        }

        List<TeamMemberDTO> users = userService.searchUsersByEmail(email);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{teamId}/members/{userId}")
    public ResponseEntity<TeamMemberDTO> updateTeamMemberRole(
            @PathVariable String teamId,
            @PathVariable String userId,
            @RequestBody TeamMemberDTO memberDTO) throws AccessDeniedException {

        TeamMemberDTO updatedMember = teamMemberService.updateTeamMemberRole(teamId, userId, memberDTO.role());
        return ResponseEntity.ok(updatedMember);
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<Void> removeTeamMember(
            @PathVariable String teamId,
            @PathVariable String userId) throws AccessDeniedException {

        boolean removed = teamMemberService.removeTeamMember(teamId, userId);
        if (!removed) {
            throw new EntityNotFoundException("Team member not found");
        }
        return ResponseEntity.noContent().build();
    }
}
