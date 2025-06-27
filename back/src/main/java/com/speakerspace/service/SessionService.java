package com.speakerspace.service;

import com.speakerspace.dto.session.*;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.model.session.*;
import com.speakerspace.repository.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SessionService {

    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;

    public SessionService(SessionRepository sessionRepository, SessionMapper sessionMapper) {
        this.sessionRepository = sessionRepository;
        this.sessionMapper = sessionMapper;
    }

    public ImportResultDTO importSessionsReview(String eventId, List<SessionReviewImportDataDTO> sessionsData) {
        logger.info("Starting import of {} sessions for event {}", sessionsData.size(), eventId);

        ImportResultDTO result = new ImportResultDTO();
        result.setTotalCount(sessionsData.size());
        result.setSuccessCount(0);
        result.setErrors(new ArrayList<>());

        for (int i = 0; i < sessionsData.size(); i++) {
            SessionReviewImportDataDTO sessionData = sessionsData.get(i);
            try {
                validateSessionReviewDataForImport(sessionData);

                SessionDTO sessionDTO = convertImportDataToSessionReviewDTO(sessionData, eventId);

                if (sessionMapper == null) {
                    throw new IllegalStateException("SessionMapper is not injected");
                }

                Session session = sessionMapper.convertToEntity(sessionDTO);
                sessionRepository.save(session);

                result.setSuccessCount(result.getSuccessCount() + 1);

            } catch (Exception e) {
                String errorMessage = String.format("Session %d (%s): %s",
                        i + 1,
                        sessionData.getTitle() != null ? sessionData.getTitle() : "No title",
                        e.getMessage());

                logger.warn("Failed to import session {}: {}", i + 1, e.getMessage());
                result.getErrors().add(errorMessage);
            }
        }

        return result;
    }

    private void validateSessionReviewDataForImport(SessionReviewImportDataDTO sessionData) {
        List<String> errors = new ArrayList<>();

        if (sessionData.getId() == null || sessionData.getId().trim().isEmpty()) {
            errors.add("ID is required");
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join(", ", errors));
        }
    }

    private SessionDTO convertImportDataToSessionReviewDTO(SessionReviewImportDataDTO importData, String eventId) {
        SessionDTO sessionDTO = new SessionDTO();

        sessionDTO.setId(importData.getId() != null ? importData.getId() : generateSessionId());
        sessionDTO.setTitle(importData.getTitle());

        String abstractText = importData.getAbstractText();
        if (abstractText == null || abstractText.trim().isEmpty()) {
            abstractText = "Description à compléter";
        }
        sessionDTO.setAbstractText(abstractText);
        sessionDTO.setDeliberationStatus(importData.getDeliberationStatus());
        sessionDTO.setConfirmationStatus(importData.getConfirmationStatus());
        sessionDTO.setLevel(importData.getLevel());
        sessionDTO.setReferences(importData.getReferences());
        sessionDTO.setEventId(eventId);
        sessionDTO.setFormats(importData.getFormats() != null ? importData.getFormats() : new ArrayList<>());
        sessionDTO.setCategories(importData.getCategories() != null ? importData.getCategories() : new ArrayList<>());
        sessionDTO.setTags(importData.getTags() != null ? importData.getTags() : new ArrayList<>());
        sessionDTO.setLanguages(importData.getLanguages() != null ? importData.getLanguages() : new ArrayList<>());
        sessionDTO.setSpeakers(importData.getSpeakers() != null ? importData.getSpeakers() : new ArrayList<>());
        sessionDTO.setReviews(importData.getReviews());

        return sessionDTO;
    }

    private String generateSessionId() {
        return "session_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }

    public List<SessionReviewImportData> getSessionsReviewAsImportData(String eventId) {
        try {
            List<Session> sessions = sessionRepository.findByEventId(eventId);

            List<SessionReviewImportData> importDataList = sessions.stream()
                    .map(sessionMapper::toSessionImportData)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            return importDataList;

        } catch (Exception e) {
            logger.error("Error retrieving sessions for event {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve sessions", e);
        }
    }

    public ImportResultDTO importSessionsSchedule(String eventId, List<SessionScheduleImportDataDTO> sessionsData) {
        logger.info("Starting schedule import of {} sessions for event {}", sessionsData.size(), eventId);

        ImportResultDTO result = new ImportResultDTO();
        result.setTotalCount(sessionsData.size());
        result.setSuccessCount(0);
        result.setErrors(new ArrayList<>());

        for (int i = 0; i < sessionsData.size(); i++) {
            SessionScheduleImportDataDTO scheduleData = sessionsData.get(i);
            try {
                validateSessionScheduleDataForImport(scheduleData);

                Session existingSession = findExistingSession(eventId, scheduleData);

                if (existingSession != null) {
                    updateSessionWithScheduleData(existingSession, scheduleData);
                    sessionRepository.save(existingSession);
                } else {
                    Session newSession = createSessionFromScheduleData(scheduleData, eventId);
                    sessionRepository.save(newSession);
                }

                result.setSuccessCount(result.getSuccessCount() + 1);

            } catch (Exception e) {
                String errorMessage = String.format("Session %d (%s): %s",
                        i + 1,
                        scheduleData.getTitle() != null ? scheduleData.getTitle() : "No title",
                        e.getMessage());

                logger.warn("Failed to import schedule session {}: {}", i + 1, e.getMessage());
                result.getErrors().add(errorMessage);
            }
        }

        return result;
    }

    private Session findExistingSession(String eventId, SessionScheduleImportDataDTO scheduleData) {
        if (scheduleData.getId() != null) {
            List<Session> sessions = sessionRepository.findByEventId(eventId);
            return sessions.stream()
                    .filter(s -> scheduleData.getId().equals(s.getId()) ||
                            (scheduleData.getProposal() != null &&
                                    scheduleData.getProposal().getId() != null &&
                                    scheduleData.getProposal().getId().equals(s.getId())))
                    .findFirst()
                    .orElse(null);
        }

        if (scheduleData.getTitle() != null) {
            List<Session> sessions = sessionRepository.findByEventId(eventId);
            return sessions.stream()
                    .filter(s -> scheduleData.getTitle().equals(s.getTitle()))
                    .findFirst()
                    .orElse(null);
        }

        return null;
    }

    private void updateSessionWithScheduleData(Session existingSession, SessionScheduleImportDataDTO scheduleData) {
        existingSession.setStart(scheduleData.getStart());
        existingSession.setEnd(scheduleData.getEnd());
        existingSession.setTrack(scheduleData.getTrack());

        if (existingSession.getLanguages() == null || existingSession.getLanguages().isEmpty()) {
            if (scheduleData.getLanguages() != null) {
                existingSession.setLanguages(Arrays.asList(scheduleData.getLanguages()));
            }
        }
    }

    private Session createSessionFromScheduleData(SessionScheduleImportDataDTO scheduleData, String eventId) {
        Session session = new Session();

        String sessionId = scheduleData.getProposal() != null && scheduleData.getProposal().getId() != null
                ? scheduleData.getProposal().getId()
                : scheduleData.getId();

        session.setId(sessionId);
        session.setTitle(scheduleData.getTitle());
        session.setStart(scheduleData.getStart());
        session.setEnd(scheduleData.getEnd());
        session.setTrack(scheduleData.getTrack());
        session.setEventId(eventId);

        if (scheduleData.getLanguages() != null) {
            session.setLanguages(Arrays.asList(scheduleData.getLanguages()));
        }

        if (scheduleData.getProposal() != null) {
            Proposal proposal = scheduleData.getProposal();
            session.setAbstractText(proposal.getAbstractText());
            session.setLevel(proposal.getLevel());
            session.setFormats(proposal.getFormats());
            session.setCategories(proposal.getCategories());
            session.setSpeakers(proposal.getSpeakers());
        }

        return session;
    }

    private void validateSessionScheduleDataForImport(SessionScheduleImportDataDTO scheduleData) {
        List<String> errors = new ArrayList<>();

        if (scheduleData.getId() == null || scheduleData.getId().trim().isEmpty()) {
            errors.add("ID is required");
        }

        if (scheduleData.getStart() == null) {
            errors.add("Start time is required");
        }

        if (scheduleData.getEnd() == null) {
            errors.add("End time is required");
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join(", ", errors));
        }
    }

    public SessionReviewImportData getSessionById(String eventId, String sessionId) {
        try {
            Session session = sessionRepository.findByIdAndEventId(sessionId, eventId);

            if (session == null) {
                logger.warn("Session with ID {} not found for event {}", sessionId, eventId);
                return null;
            }

            SessionReviewImportData importData = sessionMapper.toSessionImportData(session);
            return importData;

        } catch (Exception e) {
            logger.error("Error retrieving session {} for event {}: {}", sessionId, eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve session", e);
        }
    }

    public List<Speaker> getUniqueSpeekersByEventId(String eventId) {
        List<SessionReviewImportData> sessions = getSessionsReviewAsImportData(eventId);

        Map<String, Speaker> uniqueSpeakers = sessions.stream()
                .filter(session -> session.getSpeakers() != null)
                .flatMap(session -> session.getSpeakers().stream())
                .filter(speaker -> speaker.getName() != null && !speaker.getName().trim().isEmpty())
                .collect(Collectors.toMap(
                        speaker -> speaker.getName().toLowerCase().trim(),
                        speaker -> speaker,
                        (existing, replacement) -> existing
                ));

        return uniqueSpeakers.values().stream()
                .sorted(Comparator.comparing(speaker -> speaker.getName().toLowerCase()))
                .collect(Collectors.toList());
    }

    public List<SpeakerWithSessionsDTO> getSpeakersWithSessionsByEventId(String eventId) {
        logger.info("Getting speakers with sessions for event: {}", eventId);

        try {
            List<SessionReviewImportData> sessions = getSessionsReviewAsImportData(eventId);
            logger.info("Found {} sessions for event {}", sessions.size(), eventId);

            if (sessions.isEmpty()) {
                logger.info("No sessions found for event {}, returning empty speakers list", eventId);
                return new ArrayList<>();
            }

            Map<String, List<SessionReviewImportData>> sessionsBySpeaker = new HashMap<>();
            Map<String, Speaker> speakerMap = new HashMap<>();

            sessions.forEach(session -> {
                if (session.getSpeakers() != null && !session.getSpeakers().isEmpty()) {
                    session.getSpeakers().forEach(speaker -> {
                        if (speaker != null && speaker.getId() != null && !speaker.getId().trim().isEmpty()) {
                            String speakerId = speaker.getId();

                            speakerMap.put(speakerId, speaker);
                            sessionsBySpeaker.computeIfAbsent(speakerId, k -> new ArrayList<>()).add(session);
                        } else {
                            logger.warn("Speaker without ID found in session {}: {}",
                                    session.getId(), speaker.getName());
                        }
                    });
                }
            });

            logger.info("Found {} unique speakers for event {}", speakerMap.size(), eventId);

            List<SpeakerWithSessionsDTO> result = speakerMap.entrySet().stream()
                    .map(entry -> {
                        Speaker speaker = entry.getValue();
                        List<SessionReviewImportData> speakerSessions = sessionsBySpeaker.get(entry.getKey());
                        return new SpeakerWithSessionsDTO(speaker, speakerSessions);
                    })
                    .sorted(Comparator.comparing(dto ->
                            dto.getSpeaker().getName() != null ?
                                    dto.getSpeaker().getName().toLowerCase() : ""))
                    .collect(Collectors.toList());

            return result;

        } catch (Exception e) {
            logger.error("Error retrieving speakers with sessions for event {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve speakers with sessions for event: " + eventId, e);
        }
    }

    public Speaker getSpeakerById(String eventId, String speakerId) {
        List<SessionReviewImportData> sessions = getSessionsReviewAsImportData(eventId);

        return sessions.stream()
                .filter(session -> session.getSpeakers() != null)
                .flatMap(session -> session.getSpeakers().stream())
                .filter(speaker -> speaker.getId() != null &&
                        speaker.getId().equals(speakerId))
                .findFirst()
                .orElse(null);
    }
}
