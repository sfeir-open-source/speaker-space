package com.speakerspace.service;

import com.speakerspace.dto.TeamDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.TeamMapper;
import com.speakerspace.model.Event;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.repository.EventRepository;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TeamService {

    private final TeamMapper teamMapper;
    private final EventRepository eventRepository;
    private final TeamRepository teamRepository;
    private final UserService userService;
    private final SessionRepository sessionRepository;
    private final UserReferenceCleanupService userReferenceCleanupService;

    public TeamDTO createTeam(TeamDTO teamDTO) {
        String currentUserId = userService.getCurrentUserId();

        if (teamRepository.existsByName(teamDTO.name())) {
            throw new IllegalArgumentException("A team with this name already exists");
        }

        UserDTO currentUser = userService.getUserByUid(currentUserId);
        Team team = teamMapper.convertToEntity(teamDTO);
        team.setUserCreateId(currentUserId);
        team.addMember(currentUserId);

        for (TeamMember member : team.getMembers()) {
            if (member.getUserId().equals(currentUserId)) {
                member.setEmail(currentUser.email());
                member.setStatus("active");
                break;
            }
        }

        team.setCreatorEmail(currentUser.email());

        Team savedTeam = teamRepository.saveTeam(team);
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
                .filter(team -> ownedTeams.stream().noneMatch(t -> t.id().equals(team.id())))
                .forEach(allTeams::add);

        return allTeams;
    }

    public TeamDTO getTeamById(String urlId) {
        Team team = teamRepository.findByIdUrl(urlId);
        return team != null ? teamMapper.convertToDTO(team) : null;
    }

    public TeamDTO updateTeam(String teamId, TeamDTO teamDTO) throws AccessDeniedException {
        Team existingTeam = teamRepository.findTeamByIdOptional(teamId).orElse(null);
        if (existingTeam == null) {
            return null;
        }

        if (teamRepository.existsByName(teamDTO.name())) {
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

        existingTeam.setName(teamDTO.name());
        if (teamDTO.url() != null && !teamDTO.url().isEmpty()) {
            existingTeam.setUrl(teamDTO.url());
        }

        Team updatedTeam = teamRepository.saveTeam(existingTeam);
        return teamMapper.convertToDTO(updatedTeam);
    }

    public boolean deleteTeam(String teamId) throws AccessDeniedException {
        String currentUserId = userService.getCurrentUserId();

        Optional<Team> teamOptional = teamRepository.findTeamByIdOptional(teamId);
        if (teamOptional.isEmpty()) {
            return false;
        }

        Team team = teamOptional.get();

        if (!team.getUserCreateId().equals(currentUserId)) {
            throw new AccessDeniedException("You don't have permission to delete this team");
        }

        try {
            return deleteTeamWithFirestoreTransaction(teamId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete team and associated data", e);
        }
    }

    private boolean deleteTeamWithFirestoreTransaction(String teamId) {
        try {
            List<Event> eventsToDelete = eventRepository.findByTeamId(teamId);

            int totalDeletedSessions = 0;
            int totalDeletedSpeakers = 0;

            List<String> allEventIds = new ArrayList<>();
            List<String> allSessionIds = new ArrayList<>();
            List<String> allSpeakerIds = new ArrayList<>();

            for (Event event : eventsToDelete) {
                String eventId = event.getIdEvent();
                allEventIds.add(eventId);

                List<Session> sessionsToDelete = sessionRepository.findByEventId(eventId);

                for (Session session : sessionsToDelete) {
                    allSessionIds.add(session.getId());

                    if (session.getSpeakers() != null) {
                        for (Speaker speaker : session.getSpeakers()) {
                            if (speaker.getId() != null) {
                                allSpeakerIds.add(speaker.getId());
                                log.debug("Found speaker {} in session {} for event {}",
                                        speaker.getId(), session.getId(), eventId);
                            }
                        }
                    }
                }

                totalDeletedSessions += sessionRepository.deleteByEventId(eventId);
                totalDeletedSpeakers += allSpeakerIds.size();
            }

            int deletedEventsCount = eventRepository.deleteByTeamId(teamId);
            teamRepository.deleteTeam(teamId);

            for (String eventId : allEventIds) {
                userReferenceCleanupService.removeEventIdFromAllUsers(eventId);
            }

            for (String sessionId : allSessionIds) {
                userReferenceCleanupService.removeSessionIdFromAllUsers(sessionId);
            }

            for (String speakerId : allSpeakerIds) {
                userReferenceCleanupService.removeSpeakerIdFromAllUsers(speakerId);
            }

            log.info("Team deleted successfully: {} (with {} events, {} sessions, {} speakers). Cleaned user references.",
                    teamId, deletedEventsCount, totalDeletedSessions, totalDeletedSpeakers);

            return true;

        } catch (Exception e) {
            log.error("Error in Firestore transaction for team deletion: {}", e.getMessage(), e);
            throw e;
        }
    }
}
