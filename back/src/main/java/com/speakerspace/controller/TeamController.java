package com.speakerspace.controller;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
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

    @GetMapping("/user-teams")
    public ResponseEntity<List<TeamDTO>> getAllUserTeams() {
        List<TeamDTO> ownedTeams = teamService.getCreateTeamsForCurrentUser();
        List<TeamDTO> memberTeams = teamService.getTeamsForCurrentUser();
        List<TeamDTO> allTeams = new ArrayList<>(ownedTeams);
        for (TeamDTO team : memberTeams) {
            if (ownedTeams.stream().noneMatch(t -> t.getId().equals(team.getId()))) {
                allTeams.add(team);
            }
        }

        return ResponseEntity.ok(allTeams);
    }

    @GetMapping("/by-url/{urlId}")
    public ResponseEntity<TeamDTO> getTeamByUrl(@PathVariable String urlId) {
        TeamDTO team = teamService.getTeamByUrl(urlId);
        if (team == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(team);
    }

    @PutMapping("/{teamId}")
    public ResponseEntity<TeamDTO> updateTeam(@PathVariable String teamId, @RequestBody TeamDTO teamDTO) {
        if (teamDTO.getName() == null || teamDTO.getName().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            TeamDTO updatedTeam = teamService.updateTeam(teamId, teamDTO);
            if (updatedTeam == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(updatedTeam);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

}
