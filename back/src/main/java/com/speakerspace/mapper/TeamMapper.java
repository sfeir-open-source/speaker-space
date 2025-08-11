package com.speakerspace.mapper;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

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
                .memberIds(new ArrayList<>(team.getMemberIds()))
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
        if (teamDTO.memberIds() != null) {
            team.setMemberIds(new ArrayList<>(teamDTO.memberIds()));
        }

        if (teamDTO.members() != null) {
            List<TeamMember> members = teamDTO.members().stream()
                    .map(this::convertDTOToMember)
                    .collect(Collectors.toCollection(ArrayList::new));
            team.setMembers(members);
        }

        return team;
    }

    private TeamMemberDTO convertMemberToDTO(TeamMember member) {
        if (member == null) return null;

        return TeamMemberDTO.builder()
                .userId(member.getUserId())
                .role(member.getRole())
                .build();
    }

    private TeamMember convertDTOToMember(TeamMemberDTO dto) {
        TeamMember member = new TeamMember(dto.userId(), dto.role());
        member.setUserId(dto.userId());
        member.setRole(dto.role());
        member.setName(dto.name());
        member.setEmail(dto.email());
        member.setPhotoURL(dto.photoURL());
        member.setStatus(dto.status());
        member.setIsCreator(dto.isCreator());
        return member;
    }
}
