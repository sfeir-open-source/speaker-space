package com.speakerspace.controller;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

        TeamDTO createdTeam = teamService.createTeam(teamDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTeam);
    }

    @GetMapping("/my-other-teams")
    public ResponseEntity<List<TeamDTO>> getMyTeams() {
        List<TeamDTO> teams = teamService.getTeamsForCurrentUser();
        return ResponseEntity.ok(teams);
    }

    @GetMapping("/my-owned-teams")
    public ResponseEntity<List<TeamDTO>> getMyOwnedTeams() {
        List<TeamDTO> teams = teamService.getCreateTeamsForCurrentUser();
        return ResponseEntity.ok(teams);
    }
}
