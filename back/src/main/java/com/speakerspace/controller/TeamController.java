package com.speakerspace.controller;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.service.TeamService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/team")
public class TeamController {

    private final TeamService teamService;
    private static final Logger logger = LoggerFactory.getLogger(TeamController.class);

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
    public ResponseEntity<Map<String, Object>> deleteTeam(@PathVariable String teamId) {
        try {
            boolean deleted = teamService.deleteTeam(teamId);

            if (deleted) {
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Team and associated events deleted successfully");
                response.put("teamId", teamId);

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (AccessDeniedException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Access denied");
            errorResponse.put("message", "You don't have permission to delete this team");

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);

        } catch (Exception e) {
            logger.error("Error deleting team {}: {}", teamId, e.getMessage(), e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error");
            errorResponse.put("message", "Failed to delete team");

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
