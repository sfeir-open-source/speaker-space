package com.speakerspace.service;

import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import com.speakerspace.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamMemberService {

    private final TeamRepository teamRepository;
    private final UserService userService;

    public TeamMemberDTO addTeamMember(String teamId, TeamMemberDTO memberDTO) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);
        String currentUserId = userService.getCurrentUserId();

        boolean isCurrentUserOwner = team.getMembers().stream()
                .anyMatch(member -> member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole()));

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can add members");
        }

        UserDTO userDTO = userService.getUserByUid(memberDTO.userId());
        if (userDTO == null) {
            throw new IllegalArgumentException("User does not exist");
        }

        if (team.getMemberIds() != null && team.getMemberIds().contains(memberDTO.userId())) {
            throw new IllegalArgumentException("User is already a member of this team");
        }

        String role = Optional.ofNullable(memberDTO.role()).orElse("Member");

        team.addMemberWithRole(memberDTO.userId(), role);

        team.getMembers().stream()
                .filter(member -> member.getUserId().equals(memberDTO.userId()))
                .findFirst()
                .ifPresent(member -> {
                    member.setEmail(userDTO.email());
                    member.setStatus("active");
                });

        teamRepository.saveTeam(team);

        return TeamMemberDTO.builder()
                .userId(memberDTO.userId())
                .role(role)
                .displayName(userDTO.displayName())
                .photoURL(userDTO.photoURL())
                .email(userDTO.email())
                .status("active")
                .build();
    }

    public List<TeamMemberDTO> getTeamMembers(String teamId) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);

        return Optional.ofNullable(team.getMembers())
                .orElse(List.of())
                .stream()
                .map(this::convertMemberToDTO)
                .toList();
    }

    public TeamMemberDTO updateTeamMemberRole(String teamId, String userId, String newRole) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);
        String currentUserId = userService.getCurrentUserId();

        boolean isCurrentUserOwner = team.getMembers().stream()
                .anyMatch(member -> member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole()));

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can change member roles");
        }

        if (userId.equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        if (!"Owner".equals(newRole)) {
            long ownerCount = team.getMembers().stream()
                    .filter(member -> "Owner".equals(member.getRole()))
                    .count();

            boolean isTargetUserOwner = team.getMembers().stream()
                    .anyMatch(member -> member.getUserId().equals(userId) && "Owner".equals(member.getRole()));

            if (isTargetUserOwner && ownerCount <= 1) {
                throw new IllegalArgumentException("Cannot demote the last Owner. Promote another member to Owner first.");
            }
        }

        team.updateMemberRole(userId, newRole);
        teamRepository.saveTeam(team);

        UserDTO userDTO = userService.getUserByUid(userId);
        return TeamMemberDTO.builder()
                .userId(userId)
                .role(newRole)
                .displayName(userDTO != null ? userDTO.displayName() : null)
                .photoURL(userDTO != null ? userDTO.photoURL() : null)
                .email(userDTO != null ? userDTO.email() : null)
                .status("active")
                .build();
    }

    public boolean removeTeamMember(String teamId, String userId) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);
        String currentUserId = userService.getCurrentUserId();

        boolean isCurrentUserOwner = team.getMembers().stream()
                .anyMatch(member -> member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole()));

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can remove members");
        }

        Optional<TeamMember> targetMember = team.getMembers().stream()
                .filter(member -> member.getUserId().equals(userId))
                .findFirst();

        if (targetMember.isEmpty()) {
            return false;
        }

        if ("Owner".equals(targetMember.get().getRole())) {
            throw new IllegalArgumentException("Cannot remove an Owner. Change their role to Member first.");
        }

        team.removeMember(userId);
        teamRepository.saveTeam(team);
        return true;
    }

    public TeamMemberDTO inviteMemberByEmail(String teamId, String email) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);
        String currentUserId = userService.getCurrentUserId();

        boolean isCurrentUserOwner = team.getMembers().stream()
                .anyMatch(member -> member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole()));

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can invite members");
        }

        UserDTO existingUser = userService.getUserByEmail(email);

        if (existingUser != null) {
            if (team.getMemberIds() != null && team.getMemberIds().contains(existingUser.uid())) {
                throw new IllegalArgumentException("User is already a member of this team");
            }

            TeamMemberDTO memberDTO = TeamMemberDTO.builder()
                    .userId(existingUser.uid())
                    .role("Member")
                    .email(email)
                    .status("active")
                    .build();

            return addTeamMember(teamId, memberDTO);
        } else {
            String temporaryUserId = "invited_" + UUID.randomUUID();

            TeamMember invitedMember = new TeamMember(temporaryUserId, "Member");
            invitedMember.setEmail(email);
            invitedMember.setStatus("invited");

            team.addMemberWithRole(temporaryUserId, "Member");

            team.getMembers().stream()
                    .filter(member -> member.getUserId().equals(temporaryUserId))
                    .findFirst()
                    .ifPresent(member -> {
                        member.setEmail(email);
                        member.setStatus("invited");
                    });

            team.addInvitedEmail(email, temporaryUserId);
            teamRepository.saveTeam(team);

            return TeamMemberDTO.builder()
                    .userId(temporaryUserId)
                    .role("Member")
                    .email(email)
                    .status("invited")
                    .build();
        }
    }

    private Team validateTeamAccess(String teamId) throws AccessDeniedException {
        String currentUserId = userService.getCurrentUserId();
        Optional<Team> teamOpt = teamRepository.findTeamByIdOptional(teamId);

        if (teamOpt.isEmpty()) {
            throw new IllegalArgumentException("Team not found");
        }

        Team team = teamOpt.get();

        if (team.getMemberIds() == null || !team.getMemberIds().contains(currentUserId)) {
            throw new AccessDeniedException("You are not a member of this team");
        }

        return team;
    }

    private TeamMemberDTO convertMemberToDTO(TeamMember member) {
        UserDTO userDTO = userService.getUserByUid(member.getUserId());

        return TeamMemberDTO.builder()
                .userId(member.getUserId())
                .role(member.getRole())
                .email(member.getEmail())
                .displayName(userDTO != null ? userDTO.displayName() : null)
                .photoURL(userDTO != null ? userDTO.photoURL() : null)
                .status(member.getStatus())
                .build();
    }
}
