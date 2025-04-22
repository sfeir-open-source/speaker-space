package com.speakerspace.service;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.mapper.TeamMapper;
import com.speakerspace.model.Team;
import com.speakerspace.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private static final Logger logger = LoggerFactory.getLogger(TeamService.class);
    private final TeamMapper teamMapper;
    private final TeamRepository teamRepository;
    private final UserService userService;

    public TeamService(TeamMapper teamMapper, TeamRepository teamRepository, UserService userService) {
        this.teamMapper = teamMapper;
        this.teamRepository = teamRepository;
        this.userService = userService;
    }

    public TeamDTO createTeam(TeamDTO teamDTO) {
        String currentUserId = userService.getCurrentUserId();
        Team team = teamMapper.convertToEntity(teamDTO);
        team.setUserCreateId(currentUserId);
        team.addMember(currentUserId);
        Team savedTeam = teamRepository.save(team);

        return teamMapper.convertToDTO(savedTeam);
    }

    public List<TeamDTO> getTeamsForCurrentUser() {
        String currentUserId = userService.getCurrentUserId();
        List<Team> teams = teamRepository.findTeamsByMemberId(currentUserId);
        return teams.stream()
                .map(teamMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TeamDTO> getCreateTeamsForCurrentUser() {
        String currentUserId = userService.getCurrentUserId();
        List<Team> teams = teamRepository.findTeamsByUserCreateId(currentUserId);
        return teams.stream()
                .map(teamMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    public TeamDTO getTeamByUrl(String urlId) {
        String url = "https://speaker-space.io/team/" + urlId;
        Team team = teamRepository.findByUrl(url);

        if (team == null) {
            return null;
        }

        return teamMapper.convertToDTO(team);
    }

    public TeamDTO updateTeam(String teamId, TeamDTO teamDTO) throws AccessDeniedException {
        Team existingTeam = teamRepository.findById(teamId).orElse(null);

        if (existingTeam == null) {
            return null;
        }

        String currentUserId = userService.getCurrentUserId();
        if (!existingTeam.getUserCreateId().equals(currentUserId)) {
            throw new AccessDeniedException("You are not authorized to update this team");
        }

        existingTeam.setName(teamDTO.getName());
        if (teamDTO.getUrl() != null && !teamDTO.getUrl().isEmpty()) {
            existingTeam.setUrl(teamDTO.getUrl());
        }

        Team updatedTeam = teamRepository.save(existingTeam);
        return teamMapper.convertToDTO(updatedTeam);
    }

}