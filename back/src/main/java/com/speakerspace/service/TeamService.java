package com.speakerspace.service;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.TeamMapper;
import com.speakerspace.model.Event;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import com.speakerspace.repository.EventRepository;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.SpeakerRepository;
import com.speakerspace.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeamService {

    private static final Logger logger = LoggerFactory.getLogger(TeamService.class);

    private final TeamMapper teamMapper;
    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final UserService userService;
    private final SessionRepository sessionRepository;
    private final SpeakerRepository speakerRepository;

    public TeamService(TeamMapper teamMapper, EventRepository eventRepository, TeamRepository teamRepository, UserService userService, SessionRepository sessionRepository, SpeakerRepository speakerRepository) {
        this.teamMapper = teamMapper;
        this.eventRepository = eventRepository;
        this.teamRepository = teamRepository;
        this.userService = userService;
        this.sessionRepository = sessionRepository;
        this.speakerRepository = speakerRepository;
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
        String currentUserId = userService.getCurrentUserId();

        Optional<Team> teamOptional = teamRepository.findById(teamId);
        if (teamOptional.isEmpty()) {
            logger.warn("Attempt to delete non-existent team: {}", teamId);
            return false;
        }

        Team team = teamOptional.get();

        if (!team.getUserCreateId().equals(currentUserId)) {
            logger.warn("User {} attempted to delete team {} without permission", currentUserId, teamId);
            throw new AccessDeniedException("You don't have permission to delete this team");
        }

        try {
            return deleteTeamWithFirestoreTransaction(teamId);

        } catch (Exception e) {
            logger.error("Error deleting team {} and its dependencies: {}", teamId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete team and associated data", e);
        }
    }

    private boolean deleteTeamWithFirestoreTransaction(String teamId) {
        try {
            List<Event> eventsToDelete = eventRepository.findByTeamId(teamId);

            int totalDeletedSessions = 0;
            int totalDeletedSpeakers = 0;

            for (Event event : eventsToDelete) {
                totalDeletedSessions += sessionRepository.deleteByEventId(event.getIdEvent());
                totalDeletedSpeakers += speakerRepository.deleteByEventId(event.getIdEvent());
            }

            int deletedEventsCount = eventRepository.deleteByTeamId(teamId);

            teamRepository.delete(teamId);

            logger.info("Team deleted successfully: {} (with {} events, {} sessions, {} speakers)",
                    teamId, deletedEventsCount, totalDeletedSessions, totalDeletedSpeakers);

            return true;

        } catch (Exception e) {
            logger.error("Error in Firestore transaction for team deletion: {}", e.getMessage(), e);
            throw e;
        }
    }
}
