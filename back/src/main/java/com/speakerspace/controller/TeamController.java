package com.speakerspace.controller;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;

@RestController
@RequestMapping("/team")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @PostMapping("/create")
    public ResponseEntity<TeamDTO> createTeam(@RequestBody TeamDTO teamDTO) {
        if (teamDTO.getName() == null || teamDTO.getName().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            TeamDTO createdTeam = teamService.createTeam(teamDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTeam);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
        try {
            TeamDTO team = teamService.getTeamById(teamId);
            return team != null ? ResponseEntity.ok(team) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user-teams")
    public ResponseEntity<List<TeamDTO>> getAllUserTeams() {
        return ResponseEntity.ok(teamService.getAllUserTeams());
    }

    @GetMapping("/by-url/{id}")
    public ResponseEntity<TeamDTO> getTeamByUrl(@PathVariable String id) {
        TeamDTO team = teamService.getTeamById(id);
        return team != null ? ResponseEntity.ok(team) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{teamId}")
    public ResponseEntity<TeamDTO> updateTeam(@PathVariable String teamId, @RequestBody TeamDTO teamDTO) {
        if (teamDTO.getName() == null || teamDTO.getName().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            TeamDTO updatedTeam = teamService.updateTeam(teamId, teamDTO);
            return updatedTeam != null ? ResponseEntity.ok(updatedTeam) : ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{teamId}")
    public ResponseEntity<Void> deleteTeam(@PathVariable String teamId) {
        try {
            boolean deleted = teamService.deleteTeam(teamId);
            return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
