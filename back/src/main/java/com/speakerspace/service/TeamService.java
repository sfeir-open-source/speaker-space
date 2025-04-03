package com.speakerspace.service;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.mapper.TeamMapper;
import com.speakerspace.model.Team;
import com.speakerspace.repository.TeamRepository;
import org.springframework.stereotype.Service;

@Service
public class TeamService {

    private final TeamMapper teamMapper;
    private final TeamRepository teamRepository;

    public TeamService(TeamMapper teamMapper, TeamRepository teamRepository) {
        this.teamMapper = teamMapper;
        this.teamRepository = teamRepository;
    }

    public TeamDTO createTeam(TeamDTO teamDTO) {
        Team team = teamMapper.convertToEntity(teamDTO);
        Team savedTeam = teamRepository.save(team);
        return teamMapper.convertToDTO(savedTeam);
    }
}