package com.speakerspace.service;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.TeamMapper;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import com.speakerspace.repository.TeamRepository;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

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

        if (teamRepository.existsByName(teamDTO.getName())) {
            throw new IllegalArgumentException("A team with this name already exists");
        }

        UserDTO currentUser = userService.getUserByUid(currentUserId);
        Team team = teamMapper.convertToEntity(teamDTO);
        team.setUserCreateId(currentUserId);
        team.addMemberWithRole(currentUserId, "Owner");

        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(currentUserId)) {
                member.setEmail(currentUser.getEmail());
                member.setStatus("active");
                break;
            }
        }

        team.setCreatorEmail(currentUser.getEmail());

        Team savedTeam = teamRepository.save(team);
        return teamMapper.convertToDTO(savedTeam);
    }

    public List<TeamDTO> getTeamsForCurrentUser() {
        String currentUserId = userService.getCurrentUserId();
        return teamRepository.findTeamsByMemberId(currentUserId).stream()
                .map(teamMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TeamDTO> getCreateTeamsForCurrentUser() {
        String currentUserId = userService.getCurrentUserId();
        return teamRepository.findTeamsByUserCreateId(currentUserId).stream()
                .map(teamMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<TeamDTO> getAllUserTeams() {
        List<TeamDTO> ownedTeams = getCreateTeamsForCurrentUser();
        List<TeamDTO> memberTeams = getTeamsForCurrentUser();

        List<TeamDTO> allTeams = new ArrayList<>(ownedTeams);
        memberTeams.stream()
                .filter(team -> ownedTeams.stream().noneMatch(t -> t.getId().equals(team.getId())))
                .forEach(allTeams::add);

        return allTeams;
    }

    public TeamDTO getTeamById(String urlId) {
        String id = urlId;
        Team team = teamRepository.findByIdUrl(id);
        return team != null ? teamMapper.convertToDTO(team) : null;
    }

    public TeamDTO updateTeam(String teamId, TeamDTO teamDTO) throws AccessDeniedException {
        Team existingTeam = teamRepository.findById(teamId).orElse(null);
        if (existingTeam == null) {
            return null;
        }

        if (teamRepository.existsByName(teamDTO.getName())) {
            throw new IllegalArgumentException("A team with this name already exists");
        }

        String currentUserId = userService.getCurrentUserId();

        boolean isOwner = false;
        for (TeamMember member : existingTeam.getMembers()) {
            if (member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole())) {
                isOwner = true;
                break;
            }
        }

        if (!isOwner) {
            throw new AccessDeniedException("Only Owners can update the team");
        }

        existingTeam.setName(teamDTO.getName());
        if (teamDTO.getUrl() != null && !teamDTO.getUrl().isEmpty()) {
            existingTeam.setUrl(teamDTO.getUrl());
        }

        Team updatedTeam = teamRepository.save(existingTeam);
        return teamMapper.convertToDTO(updatedTeam);
    }

    public boolean deleteTeam(String teamId) throws AccessDeniedException {
        Team existingTeam = teamRepository.findById(teamId).orElse(null);
        if (existingTeam == null) {
            return false;
        }

        String currentUserId = userService.getCurrentUserId();

        boolean isOwner = false;
        for (TeamMember member : existingTeam.getMembers()) {
            if (member.getUserId().equals(currentUserId) && "Owner".equals(member.getRole())) {
                isOwner = true;
                break;
            }
        }

        if (!isOwner) {
            throw new AccessDeniedException("Only Owners can delete the team");
        }

        teamRepository.delete(teamId);
        return true;
    }
}
