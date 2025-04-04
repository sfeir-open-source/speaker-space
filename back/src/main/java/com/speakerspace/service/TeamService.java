package com.speakerspace.service;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.mapper.TeamMapper;
import com.speakerspace.model.Team;
import com.speakerspace.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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
}