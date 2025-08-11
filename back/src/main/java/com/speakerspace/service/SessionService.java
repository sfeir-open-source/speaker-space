package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.*;
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

import java.time.Clock;
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
    private UserSpeakerLinkService userSpeakerLinkService;

    @Autowired
    private EventService eventService;

    public boolean deleteSession(String id) {
        Session existingSession = sessionRepository.findSessionById(id);
        if (existingSession == null) {
            return false;
        }
        return sessionRepository.deleteSession(id);
    }

    public List<String> getDistinctTracksByEventId(String eventId) {
        return sessionRepository.findDistinctTracksByEventId(eventId);
    }

    public ImportResultDTO importSessionsReview(String eventId, List<SessionDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (SessionDTO importData : importDataList) {
            try {
                String appId = generateSessionId();

                SessionDTO sessionDTO = sessionImportMapper.convertImportDataToSessionDTO(importData, eventId, appId);

                List<Speaker> processedSpeakers = sessionImportMapper.processSpeakersForImport(
                        sessionDTO.speakers(), eventId, importData.id());

                Session session = sessionMapper.convertToEntity(sessionDTO);
                session.setIdConferenceHall(importData.id());
                session.setSpeakers(processedSpeakers);

                sessionRepository.saveSession(session);

                if (session.getSpeakers() != null) {
                    for (Speaker speaker : session.getSpeakers()) {
                        userSpeakerLinkService.linkSpeakerToUser(speaker, eventId);
                    }
                }

                successfulImports.add(importData.id());
                log.info("Successfully imported session {} with app ID {}", importData.id(), appId);

            } catch (Exception e) {
                log.error("Failed to import session {}", importData.id(), e);
                failedImports.add(importData.id());
                errors.add("Failed to import session " + importData.id() + ": " + e.getMessage());
            }
        }
        userSpeakerLinkService.updateUserSessionLinks(eventId);

        return ImportResultDTO.builder()
                .successfulImports(successfulImports)
                .failedImports(failedImports)
                .totalCount(importDataList.size())
                .successCount(successfulImports.size())
                .errors(errors)
                .build();
    }

    public ImportResultDTO importSessionsSchedule(String eventId, List<SessionScheduleImportDataDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        EventDTO event = eventService.getEventById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        List<SessionScheduleImportDataDTO> convertedSessions = importDataList.stream()
                .map(sessionScheduleMapper::convertUtcToLocalDateTime)
                .collect(Collectors.toList());

        eventService.updateEventDatesFromSessions(eventId, convertedSessions);

        for (SessionScheduleImportDataDTO scheduleData : convertedSessions) {
            String conferenceHallId = null;
            try {
                conferenceHallId = sessionScheduleMapper.extractConferenceHallId(scheduleData);

                Session existingSession = sessionRepository.findByIdConferenceHallAndEventId(conferenceHallId, eventId);

                if (existingSession != null) {
                    sessionScheduleMapper.enrichExistingSessionWithScheduleData(existingSession, scheduleData);
                    sessionRepository.saveSession(existingSession);
                    if (existingSession.getSpeakers() != null) {
                        for (Speaker speaker : existingSession.getSpeakers()) {
                            userSpeakerLinkService.linkSpeakerToUser(speaker, eventId);
                        }
                    }
                    log.info("Successfully updated session with ConferenceHall ID {} (app ID: {})",
                            conferenceHallId, existingSession.getId());
                } else {
                    Session newSession = sessionScheduleMapper.createSessionFromScheduleData(scheduleData, eventId);
                    sessionRepository.saveSession(newSession);
                    if (newSession.getSpeakers() != null) {
                        for (Speaker speaker : newSession.getSpeakers()) {
                            userSpeakerLinkService.linkSpeakerToUser(speaker, eventId);
                        }
                    }
                    log.info("Successfully created new session with ConferenceHall ID {} (app ID: {})",
                            conferenceHallId, newSession.getId());
                }

                successfulImports.add(conferenceHallId);

            } catch (Exception e) {
                String finalSessionId = conferenceHallId != null ? conferenceHallId :
                        (scheduleData.proposal() != null ? scheduleData.proposal().id() : scheduleData.id());
                failedImports.add(finalSessionId);
                errors.add("Failed to import schedule for session " + finalSessionId + ": " + e.getMessage());
            }
        }
        userSpeakerLinkService.updateUserSessionLinks(eventId);

        return ImportResultDTO.builder()
                .successfulImports(successfulImports)
                .failedImports(failedImports)
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

        String sessionId = generateSessionId();

        Session session = sessionCreateMapper.convertCreateRequestToSession(sessionId, eventId, createRequest);

        sessionRepository.saveSession(session);

        log.info("Successfully created session {} '{}' for event {}",
                sessionId, createRequest.title(), eventId);
        return sessionMapper.convertToDTO(session);
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

    public SessionDTO getSessionByIdAndEventId(String sessionId, String eventId) {
        Session session = sessionRepository.findByIdAndEventId(sessionId, eventId);
        return session != null ? sessionMapper.convertToDTO(session) : null;
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

    private String generateSessionId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
