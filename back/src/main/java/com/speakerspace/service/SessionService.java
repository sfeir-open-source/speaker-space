package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.*;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.mapper.session.SessionCreateMapper;
import com.speakerspace.mapper.session.SessionImportMapper;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.mapper.session.SessionScheduleMapper;
import com.speakerspace.model.session.*;
import com.speakerspace.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final SessionImportMapper sessionImportMapper;
    private final SessionScheduleMapper sessionScheduleMapper;
    private final SessionCreateMapper sessionCreateMapper;

    @Autowired
    private EventService eventService;
    @Autowired
    private SessionSpeakerManagementService sessionSpeakerManagementService;

    public ImportResultDTO importSessionsReview(String eventId, List<SessionDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();
        List<String> skippedImports = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        Set<String> allExistingConferenceHallIds = sessionRepository.findAllExistingConferenceHallIds();

        for (SessionDTO importData : importDataList) {
            String sessionConferenceId = importData.id();
            String sessionName = importData.title();
            try {
                if (allExistingConferenceHallIds.contains(sessionConferenceId)) {
                    Session existingSession = sessionRepository.findByIdConferenceHall(sessionConferenceId);
                    String existingEventId = existingSession != null ? existingSession.getEventId() : "unknown";

                    log.debug("Session {} already exists in event {}, skipping import",
                            sessionConferenceId, existingEventId);
                    skippedImports.add(sessionConferenceId);
                    errors.add("Session \"" + sessionName + "\" already exists in event other event");
                    continue;
                }

                String appId = generateSessionId();
                SessionDTO sessionDTO = sessionImportMapper.convertImportDataToSessionDTO(importData, eventId, appId);

                List<Speaker> processedSpeakers = sessionImportMapper.processSpeakersForImport(
                        sessionDTO.speakers(), eventId, sessionConferenceId);

                Session session = sessionMapper.convertToEntity(sessionDTO);
                session.setIdConferenceHall(sessionConferenceId);
                session.setSpeakers(processedSpeakers != null ? processedSpeakers : new ArrayList<>());

                sessionRepository.saveSession(session);

                allExistingConferenceHallIds.add(sessionConferenceId);

                successfulImports.add(sessionConferenceId);
                log.debug("Successfully imported session {} with app ID {}", sessionConferenceId, appId);

            } catch (Exception e) {
                log.error("Failed to import session {}: {}", sessionConferenceId, e.getMessage(), e);
                failedImports.add(sessionConferenceId);
                errors.add("Failed to import session " + sessionConferenceId + ": " + e.getMessage());
            }
        }

        return ImportResultDTO.builder()
                .successfulImports(successfulImports)
                .failedImports(failedImports)
                .skippedImports(skippedImports)
                .totalCount(importDataList.size())
                .successCount(successfulImports.size())
                .errors(errors)
                .build();
    }

    public ImportResultDTO importSessionsSchedule(String eventId, List<SessionScheduleImportDataDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();
        List<String> skippedImports = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        log.info("Starting schedule import of {} sessions for event {}", importDataList.size(), eventId);

        EventDTO event = eventService.getEventById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        List<SessionScheduleImportDataDTO> convertedSessions = importDataList.stream()
                .map(sessionScheduleMapper::convertUtcToLocalDateTime)
                .collect(Collectors.toList());

        try {
            eventService.updateEventDatesFromSessions(eventId, convertedSessions);
        } catch (Exception e) {
            log.warn("Failed to update event dates for {}: {}", eventId, e.getMessage());
        }

        for (SessionScheduleImportDataDTO scheduleData : convertedSessions) {
            String conferenceHallId = null;
            try {
                conferenceHallId = sessionScheduleMapper.extractConferenceHallId(scheduleData);

                Session existingSession = sessionRepository.findByIdConferenceHall(conferenceHallId);

                if (existingSession != null) {
                    if (!eventId.equals(existingSession.getEventId())) {
                        log.debug("Session {} exists in different event {}, skipping schedule import",
                                conferenceHallId, existingSession.getEventId());
                        skippedImports.add(conferenceHallId);
                        errors.add("Session " + conferenceHallId + " exists in other event ");
                        continue;
                    }

                    if (hasScheduleData(existingSession)) {
                        log.debug("Session {} already has schedule data, skipping", conferenceHallId);
                        skippedImports.add(conferenceHallId);
                        continue;
                    }

                    sessionScheduleMapper.enrichExistingSessionWithScheduleData(existingSession, scheduleData);
                    sessionRepository.saveSession(existingSession);

                    log.debug("Successfully updated session with ConferenceHall ID {} (app ID: {})",
                            conferenceHallId, existingSession.getId());
                } else {
                    Session newSession = sessionScheduleMapper.createSessionFromScheduleData(scheduleData, eventId);
                    sessionRepository.saveSession(newSession);

                    log.debug("Successfully created new session with ConferenceHall ID {} (app ID: {})",
                            conferenceHallId, newSession.getId());
                }

                successfulImports.add(conferenceHallId);

            } catch (Exception e) {
                String finalSessionId = conferenceHallId != null ? conferenceHallId :
                        (scheduleData.proposal() != null ? scheduleData.proposal().id() : scheduleData.id());

                log.error("Failed to import schedule for session {}: {}", finalSessionId, e.getMessage(), e);
                failedImports.add(finalSessionId);
                errors.add("Failed to import schedule for session " + finalSessionId + ": " + e.getMessage());
            }
        }

        return ImportResultDTO.builder()
                .successfulImports(successfulImports)
                .failedImports(failedImports)
                .skippedImports(skippedImports)
                .totalCount(importDataList.size())
                .successCount(successfulImports.size())
                .errors(errors)
                .build();
    }

    public SessionDTO createSession(String eventId, SessionCreateRequestDTO createRequest) {
        EventDTO event = eventService.getEventById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        Optional<String> emptySessionId = sessionSpeakerManagementService
                .findEmptySessionForSpeakers(createRequest.speakers(), eventId);

        if (emptySessionId.isPresent()) {
            return sessionSpeakerManagementService.updateEmptySession(emptySessionId.get(), createRequest);
        } else {
            return createNewSession(eventId, createRequest);
        }
    }

    private SessionDTO createNewSession(String eventId, SessionCreateRequestDTO createRequest) {
        String sessionId = generateSessionId();
        Session session = sessionCreateMapper.convertCreateRequestToSession(sessionId, eventId, createRequest);
        sessionRepository.saveSession(session);

        log.info("Successfully created new session {} '{}' for event {}",
                sessionId, createRequest.title(), eventId);
        return sessionMapper.convertToDTO(session);
    }

    public boolean deleteSession(String id) {
        Session existingSession = sessionRepository.findSessionById(id)
                .orElseThrow(() -> new EntityNotFoundException("Session not found: " + id));

        List<String> speakerIds = new ArrayList<>();
        if (existingSession.getSpeakers() != null) {
            for (Speaker speaker : existingSession.getSpeakers()) {
                if (speaker.getId() != null) {
                    speakerIds.add(speaker.getId());
                }
            }
        }

        return sessionRepository.deleteSession(id);
    }

    public List<String> getDistinctTracksByEventId(String eventId) {
        return sessionRepository.findDistinctTracksByEventId(eventId);
    }

    public List<Speaker> getUniqueSpeekersByEventId(String eventId) {
        return sessionRepository.findUniqueSpeekersByEventId(eventId);
    }

    public Speaker getSpeakerById(String eventId, String speakerId) {
        List<Speaker> speakers = getUniqueSpeekersByEventId(eventId);
        return speakers.stream()
                .filter(speaker -> speakerId.equals(speaker.getId()))
                .findFirst()
                .orElse(null);
    }

    public List<SpeakerWithSessionsDTO> getSpeakersWithSessionsByEventId(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);
        Map<String, Speaker> uniqueSpeakers = new HashMap<>();
        Map<String, List<SessionImportData>> speakerSessions = new HashMap<>();

        sessions.forEach(session -> {
            if (session.getSpeakers() != null) {
                session.getSpeakers().forEach(speaker -> {
                    String speakerKey = speaker.getEmail() != null ?
                            speaker.getEmail().toLowerCase() : speaker.getId();

                    uniqueSpeakers.put(speakerKey, speaker);

                    speakerSessions.computeIfAbsent(speakerKey, k -> new ArrayList<>())
                            .add(sessionMapper.toSessionImportData(session));
                });
            }
        });

        List<SpeakerWithSessionsDTO> result = uniqueSpeakers.entrySet().stream()
                .map(entry -> new SpeakerWithSessionsDTO(
                        entry.getValue(),
                        speakerSessions.get(entry.getKey())
                ))
                .collect(Collectors.toCollection(ArrayList::new));

        result.sort(Comparator.comparing(dto -> dto.speaker().getName().toLowerCase()));
        return result;
    }

    public List<SessionImportData> getSessionsByEventAndSpeakerEmail(String eventId, String speakerEmail) {
        List<Session> sessions = sessionRepository.findByEventIdAndSpeakerEmail(eventId, speakerEmail);
        return sessions.stream()
                .map(sessionMapper::toSessionImportData)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public SessionImportData getSessionByIdForSpeaker(String eventId, String sessionId, String speakerEmail) {
        List<Session> speakerSessions = sessionRepository.findByEventIdAndSpeakerEmail(eventId, speakerEmail);

        Session targetSession = speakerSessions.stream()
                .filter(session -> sessionId.equals(session.getId()))
                .findFirst()
                .orElse(null);

        return targetSession != null ? sessionMapper.toSessionImportData(targetSession) : null;
    }

    public Speaker getSpeakerByEmailAndEventId(String email, String eventId) {
        List<Speaker> speakers = getUniqueSpeekersByEventId(eventId);
        return speakers.stream()
                .filter(speaker -> email.equalsIgnoreCase(speaker.getEmail()))
                .findFirst()
                .orElse(null);
    }

    public List<SessionImportData> getSessionsReviewAsImportData(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);

        return sessions.stream()
                .map(sessionMapper::toSessionImportData)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public SessionImportData getSessionById(String eventId, String sessionId) {
        Session session = sessionRepository.findByIdAndEventId(sessionId, eventId);
        return session != null ? sessionMapper.toSessionImportData(session) : null;
    }

    public List<SessionDTO> getSessionsWithScheduleByEventId(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);

        return sessions.stream()
                .map(sessionMapper::convertToDTO)
                .filter(Objects::nonNull)
                .filter(session -> session.start() != null && session.end() != null)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public SessionDTO updateSessionSchedule(String sessionId, String eventId, Session scheduleUpdate) {
        if (!sessionRepository.existsByIdAndEventId(sessionId, eventId)) {
            throw new IllegalArgumentException("Session not found or does not belong to the specified event");
        }

        Date startDate = scheduleUpdate.getStart();
        Date endDate = scheduleUpdate.getEnd();
        String track = scheduleUpdate.getTrack();

        log.debug("Updating session {} with start: {}, end: {}, track: {}",
                sessionId, startDate, endDate, track);

        Session updatedSession = sessionRepository.updateScheduleFields(
                sessionId,
                startDate,
                endDate,
                track
        );

        if (updatedSession == null) {
            throw new RuntimeException("Failed to update session schedule");
        }

        return sessionMapper.convertToDTO(updatedSession);
    }


    public void validateEventIdMatch(String pathEventId, String bodyEventId) {
        if (!pathEventId.equals(bodyEventId)) {
            throw new IllegalArgumentException("Event ID mismatch");
        }
    }

    public void validateSessionsData(List<SessionScheduleImportDataDTO> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            throw new IllegalArgumentException("No sessions data provided");
        }
    }

    public void validateCreateRequest(SessionCreateRequestDTO request) {
        if (request.title() == null || request.title().trim().isEmpty()) {
            throw new IllegalArgumentException("Session title is required");
        }
        if (request.title().length() > 200) {
            throw new IllegalArgumentException("Session title must not exceed 200 characters");
        }
        if (request.abstractText() != null && request.abstractText().length() > 2000) {
            throw new IllegalArgumentException("Abstract must not exceed 2000 characters");
        }
    }

    private String generateSessionId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private boolean hasScheduleData(Session session) {
        return session.getStart() != null && session.getEnd() != null;
    }
}
