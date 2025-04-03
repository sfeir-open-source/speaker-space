package com.speakerspace.mapper;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.model.Team;
import org.springframework.stereotype.Component;

@Component
public class TeamMapper {

    public TeamDTO convertToDTO(Team team) {
        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setId(team.getId());
        teamDTO.setName(team.getName());
        teamDTO.setUrl(team.getUrl());
        return teamDTO;
    }

    public Team convertToEntity(TeamDTO teamDTO) {
        Team team = new Team();
        team.setId(teamDTO.getId());
        team.setName(teamDTO.getName());
        team.setUrl(teamDTO.getUrl());
        return team;
    }
}
