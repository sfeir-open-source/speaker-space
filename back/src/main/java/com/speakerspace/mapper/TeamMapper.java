package com.speakerspace.mapper;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class TeamMapper {

    public TeamDTO convertToDTO(Team team) {
        if (team == null) {
            return null;
        }

        TeamDTO teamDTO = new TeamDTO();
        teamDTO.setId(team.getId());
        teamDTO.setName(team.getName());
        teamDTO.setUrl(team.getUrl());
        teamDTO.setUserCreateId(team.getUserCreateId());
        teamDTO.setCreatorEmail(team.getCreatorEmail());
        teamDTO.setMemberIds(team.getMemberIds());

        if (team.getMembers() != null) {
            List<TeamMemberDTO> memberDTOs = team.getMembers().stream()
                    .map(this::convertMemberToDTO)
                    .collect(Collectors.toList());
            teamDTO.setMembers(memberDTOs);
        } else {
            teamDTO.setMembers(new ArrayList<>());
        }

        return teamDTO;
    }

    public Team convertToEntity(TeamDTO teamDTO) {
        if (teamDTO == null) {
            return null;
        }

        Team team = new Team();
        team.setId(teamDTO.getId());
        team.setName(teamDTO.getName());
        team.setUrl(teamDTO.getUrl());
        team.setUserCreateId(teamDTO.getUserCreateId());
        team.setCreatorEmail(teamDTO.getCreatorEmail());
        team.setMemberIds(teamDTO.getMemberIds());

        if (teamDTO.getMembers() != null) {
            List<TeamMember> members = teamDTO.getMembers().stream()
                    .map(this::convertMemberToEntity)
                    .collect(Collectors.toList());
            team.setMembers(members);
        } else {
            team.setMembers(new ArrayList<>());
        }

        return team;
    }

    private TeamMemberDTO convertMemberToDTO(TeamMember member) {
        if (member == null) {
            return null;
        }

        TeamMemberDTO dto = new TeamMemberDTO();
        dto.setUserId(member.getUserId());
        dto.setRole(member.getRole());
        return dto;
    }

    private TeamMember convertMemberToEntity(TeamMemberDTO dto) {
        if (dto == null) {
            return null;
        }

        return new TeamMember(dto.getUserId(), dto.getRole());
    }
}
