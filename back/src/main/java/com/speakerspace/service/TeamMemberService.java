package com.speakerspace.service;

import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import com.speakerspace.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class TeamMemberService {

    private final TeamRepository teamRepository;
    private final UserService userService;

    public TeamMemberService(TeamRepository teamRepository, UserService userService) {
        this.teamRepository = teamRepository;
        this.userService = userService;
    }

    public List<TeamMemberDTO> getTeamMembers(String teamId) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);

        List<TeamMemberDTO> memberDTOs = new ArrayList<>();

        if (team.getMembers() != null) {
            for (TeamMember member : team.getMembers()) {
                TeamMemberDTO dto = new TeamMemberDTO();
                dto.setUserId(member.getUserId());
                dto.setRole(member.getRole());

                UserDTO userDTO = userService.getUserByUid(member.getUserId());
                if (userDTO != null) {
                    dto.setDisplayName(userDTO.getDisplayName());
                    dto.setPhotoURL(userDTO.getPhotoURL());
                    dto.setEmail(userDTO.getEmail());
                }

                memberDTOs.add(dto);
            }
        }

        return memberDTOs;
    }

    public TeamMemberDTO addTeamMember(String teamId, TeamMemberDTO memberDTO) throws AccessDeniedException {
        Team team = validateTeamOwnership(teamId);

        UserDTO userDTO = userService.getUserByUid(memberDTO.getUserId());
        if (userDTO == null) {
            throw new IllegalArgumentException("User does not exist");
        }

        if (team.getMemberIds() != null && team.getMemberIds().contains(memberDTO.getUserId())) {
            throw new IllegalArgumentException("User is already a member of this team");
        }

        String role = memberDTO.getRole() != null ? memberDTO.getRole() : "Member";

        team.addMemberWithRole(memberDTO.getUserId(), role);

        teamRepository.save(team);

        TeamMemberDTO resultDTO = new TeamMemberDTO();
        resultDTO.setUserId(memberDTO.getUserId());
        resultDTO.setRole(role);
        resultDTO.setDisplayName(userDTO.getDisplayName());
        resultDTO.setPhotoURL(userDTO.getPhotoURL());
        resultDTO.setEmail(userDTO.getEmail());

        return resultDTO;
    }

    public TeamMemberDTO updateTeamMemberRole(String teamId, String userId, String newRole) throws AccessDeniedException {
        Team team = validateTeamOwnership(teamId);

        boolean memberExists = false;
        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(userId)) {
                memberExists = true;
                break;
            }
        }

        if (!memberExists) {
            throw new IllegalArgumentException("User is not a member of this team");
        }

        team.updateMemberRole(userId, newRole);

        teamRepository.save(team);

        TeamMemberDTO resultDTO = new TeamMemberDTO();
        resultDTO.setUserId(userId);
        resultDTO.setRole(newRole);
        UserDTO userDTO = userService.getUserByUid(userId);
        if (userDTO != null) {
            resultDTO.setDisplayName(userDTO.getDisplayName());
            resultDTO.setPhotoURL(userDTO.getPhotoURL());
        }

        return resultDTO;
    }

    public boolean removeTeamMember(String teamId, String userId) throws AccessDeniedException {
        Team team = validateTeamOwnership(teamId);

        boolean memberExists = false;
        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(userId)) {
                memberExists = true;
                break;
            }
        }

        if (!memberExists) {
            return false;
        }

        if (team.getUserCreateId().equals(userId)) {
            throw new IllegalArgumentException("Cannot remove the team owner");
        }

        team.removeMember(userId);

        teamRepository.save(team);

        return true;
    }

    private Team validateTeamAccess(String teamId) throws AccessDeniedException {
        String currentUserId = userService.getCurrentUserId();
        Optional<Team> teamOpt = teamRepository.findById(teamId);

        if (teamOpt.isEmpty()) {
            throw new IllegalArgumentException("Team not found");
        }

        Team team = teamOpt.get();

        if (team.getMemberIds() == null || !team.getMemberIds().contains(currentUserId)) {
            throw new AccessDeniedException("You are not a member of this team");
        }

        return team;
    }

    private Team validateTeamOwnership(String teamId) throws AccessDeniedException {
        String currentUserId = userService.getCurrentUserId();
        Optional<Team> teamOpt = teamRepository.findById(teamId);

        if (teamOpt.isEmpty()) {
            throw new IllegalArgumentException("Team not found");
        }

        Team team = teamOpt.get();

        if (!team.getUserCreateId().equals(currentUserId)) {
            throw new AccessDeniedException("You are not the owner of this team");
        }

        return team;
    }
}
