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
import java.util.UUID;

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
                dto.setEmail(member.getEmail());

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
        Team team = validateTeamAccess(teamId);

        String currentUserId = userService.getCurrentUserId();
        boolean isCurrentUserOwner = false;
        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole())) {
                isCurrentUserOwner = true;
                break;
            }
        }

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can add members");
        }

        UserDTO userDTO = userService.getUserByUid(memberDTO.getUserId());
        if (userDTO == null) {
            throw new IllegalArgumentException("User does not exist");
        }

        if (team.getMemberIds() != null && team.getMemberIds().contains(memberDTO.getUserId())) {
            throw new IllegalArgumentException("User is already a member of this team");
        }

        String role = memberDTO.getRole() != null ? memberDTO.getRole() : "Member";

        team.addMemberWithRole(memberDTO.getUserId(), role);

        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(memberDTO.getUserId())) {
                member.setEmail(userDTO.getEmail());
                member.setStatus("active");
                break;
            }
        }

        teamRepository.save(team);

        TeamMemberDTO resultDTO = new TeamMemberDTO();
        resultDTO.setUserId(memberDTO.getUserId());
        resultDTO.setRole(role);
        resultDTO.setDisplayName(userDTO.getDisplayName());
        resultDTO.setPhotoURL(userDTO.getPhotoURL());
        resultDTO.setEmail(userDTO.getEmail());
        resultDTO.setStatus("active");

        return resultDTO;
    }

    public TeamMemberDTO updateTeamMemberRole(String teamId, String userId, String newRole) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);
        String currentUserId = userService.getCurrentUserId();

        boolean isCurrentUserOwner = false;
        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole())) {
                isCurrentUserOwner = true;
                break;
            }
        }

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can change member roles");
        }

        if (userId.equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot change your own role");
        }

        if ("Owner".equals(newRole)) {
        } else {
            int ownerCount = 0;
            boolean isTargetUserOwner = false;

            for (TeamMember member : team.getMembers()) {
                if ("Owner".equals(member.getRole())) {
                    ownerCount++;
                    if (member.getUserId().equals(userId)) {
                        isTargetUserOwner = true;
                    }
                }
            }

            if (isTargetUserOwner && ownerCount <= 1) {
                throw new IllegalArgumentException("Cannot demote the last Owner. Promote another member to Owner first.");
            }
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
            resultDTO.setEmail(userDTO.getEmail());
        }

        return resultDTO;
    }


    public boolean removeTeamMember(String teamId, String userId) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);
        String currentUserId = userService.getCurrentUserId();

        boolean isCurrentUserOwner = false;
        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole())) {
                isCurrentUserOwner = true;
                break;
            }
        }

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can remove members");
        }

        boolean memberExists = false;
        boolean isTargetUserOwner = false;

        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(userId)) {
                memberExists = true;
                if ("Owner".equals(member.getRole())) {
                    isTargetUserOwner = true;
                }
                break;
            }
        }

        if (!memberExists) {
            return false;
        }

        if (isTargetUserOwner) {
            throw new IllegalArgumentException("Cannot remove an Owner. Change their role to Member first.");
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

    public TeamMemberDTO inviteMemberByEmail(String teamId, String email) throws AccessDeniedException {
        Team team = validateTeamAccess(teamId);

        String currentUserId = userService.getCurrentUserId();
        boolean isCurrentUserOwner = false;
        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole())) {
                isCurrentUserOwner = true;
                break;
            }
        }

        if (!isCurrentUserOwner) {
            throw new AccessDeniedException("Only Owners can invite members");
        }

        UserDTO existingUser = userService.getUserByEmail(email);

        if (existingUser != null) {
            if (team.getMemberIds() != null && team.getMemberIds().contains(existingUser.getUid())) {
                throw new IllegalArgumentException("User is already a member of this team");
            }

            TeamMemberDTO memberDTO = new TeamMemberDTO();
            memberDTO.setUserId(existingUser.getUid());
            memberDTO.setRole("Member");
            memberDTO.setEmail(email);
            memberDTO.setStatus("active");
            return addTeamMember(teamId, memberDTO);
        } else {
            String temporaryUserId = "invited_" + UUID.randomUUID().toString();

            TeamMember invitedMember = new TeamMember(temporaryUserId, "Member");
            invitedMember.setEmail(email);
            invitedMember.setStatus("invited");

            team.addMemberWithRole(temporaryUserId, "Member");

            for (TeamMember member : team.getMembers()) {
                if (member.getUserId().equals(temporaryUserId)) {
                    member.setEmail(email);
                    member.setStatus("invited");
                    break;
                }
            }

            team.addInvitedEmail(email, temporaryUserId);

            teamRepository.save(team);

            TeamMemberDTO resultDTO = new TeamMemberDTO();
            resultDTO.setUserId(temporaryUserId);
            resultDTO.setRole("Member");
            resultDTO.setEmail(email);
            resultDTO.setStatus("invited");

            return resultDTO;
        }
    }
}