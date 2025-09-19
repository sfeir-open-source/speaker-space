package com.speakerspace.controller;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/team")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping("/create")
    public ResponseEntity<TeamDTO> createTeam(@RequestBody TeamDTO teamDTO) {
        if (teamDTO.name() == null || teamDTO.name().isEmpty()) {
            throw new IllegalArgumentException("Team name is required");
        }

        TeamDTO createdTeam = teamService.createTeam(teamDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTeam);
    }

    @GetMapping("/my-other-teams")
    public ResponseEntity<List<TeamDTO>> getMyTeams() {
        return ResponseEntity.ok(teamService.getTeamsForCurrentUser());
    }

    @GetMapping("/my-owned-teams")
    public ResponseEntity<List<TeamDTO>> getMyOwnedTeams() {
        return ResponseEntity.ok(teamService.getCreateTeamsForCurrentUser());
    }

    @GetMapping("/{teamId}")
    public ResponseEntity<TeamDTO> getTeamById(@PathVariable String teamId) {
        TeamDTO team = teamService.getTeamById(teamId);
        if (team == null) {
            throw new EntityNotFoundException("Team not found with id: " + teamId);
        }
        return ResponseEntity.ok(team);
    }

    @GetMapping("/user-teams")
    public ResponseEntity<List<TeamDTO>> getAllUserTeams() {
        return ResponseEntity.ok(teamService.getAllUserTeams());
    }

    @GetMapping("/by-url/{id}")
    public ResponseEntity<TeamDTO> getTeamByUrl(@PathVariable String id) {
        TeamDTO team = teamService.getTeamById(id);
        if (team == null) {
            throw new EntityNotFoundException("Team not found with id: " + id);
        }
        return ResponseEntity.ok(team);
    }

    @PutMapping("/{teamId}")
    public ResponseEntity<TeamDTO> updateTeam(@PathVariable String teamId, @RequestBody TeamDTO teamDTO) throws AccessDeniedException {
        if (teamDTO.name() == null || teamDTO.name().isEmpty()) {
            throw new IllegalArgumentException("Team name is required");
        }

        TeamDTO updatedTeam = teamService.updateTeam(teamId, teamDTO);
        if (updatedTeam == null) {
            throw new EntityNotFoundException("Team not found with id: " + teamId);
        }
        return ResponseEntity.ok(updatedTeam);
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<Map<String, Object>> deleteTeam(@PathVariable String teamId) throws AccessDeniedException {
        boolean deleted = teamService.deleteTeam(teamId);

        if (!deleted) {
            throw new EntityNotFoundException("Team not found with id: " + teamId);
        }

        Map<String, Object> response = Map.of(
                "message", "Team and associated events deleted successfully",
                "teamId", teamId
        );

        return ResponseEntity.ok(response);
    }
}
