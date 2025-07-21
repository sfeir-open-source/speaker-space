package com.speakerspace.mapper;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class TeamMapper {

    public TeamDTO convertToDTO(Team team) {
        if (team == null) return null;

        return TeamDTO.builder()
                .id(team.getId())
                .name(team.getName())
                .url(team.getUrl())
                .userCreateId(team.getUserCreateId())
                .creatorEmail(team.getCreatorEmail())
                .memberIds(team.getMemberIds())
                .members(team.getMembers() != null
                        ? team.getMembers().stream()
                        .map(this::convertMemberToDTO)
                        .toList()
                        : Collections.emptyList())
                .build();
    }

    public Team convertToEntity(TeamDTO teamDTO) {
        if (teamDTO == null) return null;

        Team team = new Team();
        team.setId(teamDTO.id());
        team.setName(teamDTO.name());
        team.setUrl(teamDTO.url());
        team.setUserCreateId(teamDTO.userCreateId());
        team.setCreatorEmail(teamDTO.creatorEmail());
        team.setMemberIds(teamDTO.memberIds());

        team.setMembers(teamDTO.members() != null
                ? teamDTO.members().stream()
                .map(this::convertMemberToEntity)
                .toList()
                : Collections.emptyList());

        return team;
    }

    private TeamMemberDTO convertMemberToDTO(TeamMember member) {
        if (member == null) return null;

        return TeamMemberDTO.builder()
                .userId(member.getUserId())
                .role(member.getRole())
                .build();
    }

    private TeamMember convertMemberToEntity(TeamMemberDTO dto) {
        if (dto == null) return null;

        return new TeamMember(dto.userId(), dto.role());
    }
}
