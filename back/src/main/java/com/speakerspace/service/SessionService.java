package com.speakerspace.service;

import com.speakerspace.dto.session.ImportResultDTO;
import com.speakerspace.dto.session.SessionDTO;
import com.speakerspace.dto.session.SessionImportDataDTO;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.repository.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
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

    public ImportResultDTO importSessions(String eventId, List<SessionImportDataDTO> sessionsData) {
        logger.info("Starting import of {} sessions for event {}", sessionsData.size(), eventId);

        ImportResultDTO result = new ImportResultDTO();
        result.setTotalCount(sessionsData.size());
        result.setSuccessCount(0);
        result.setErrors(new ArrayList<>());

        for (int i = 0; i < sessionsData.size(); i++) {
            SessionImportDataDTO sessionData = sessionsData.get(i);
            try {
                validateSessionDataForImport(sessionData);

                SessionDTO sessionDTO = convertImportDataToSessionDTO(sessionData, eventId);

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

    private void validateSessionDataForImport(SessionImportDataDTO sessionData) {
        List<String> errors = new ArrayList<>();

        if (sessionData.getId() == null || sessionData.getId().trim().isEmpty()) {
            errors.add("ID is required");
        }

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join(", ", errors));
        }
    }

    private SessionDTO convertImportDataToSessionDTO(SessionImportDataDTO importData, String eventId) {
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

    public List<SessionImportData> getSessionsAsImportData(String eventId) {
        try {
            List<Session> sessions = sessionRepository.findByEventId(eventId);

            List<SessionImportData> importDataList = sessions.stream()
                    .map(sessionMapper::toSessionImportData)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            return importDataList;

        } catch (Exception e) {
            logger.error("Error retrieving sessions for event {}: {}", eventId, e.getMessage(), e);
            throw new RuntimeException("Failed to retrieve sessions", e);
        }
    }
//
//    public List<Session> getSessionsByEventId(String eventId) {
//        try {
//            List<Session> sessions = sessionRepository.findByEventId(eventId);
//            return sessions.stream()
//                    .map(sessionMapper::toImportData)
//                    .collect(Collectors.toList());
//        } catch (Exception e) {
//            logger.error("Error retrieving sessions for event {}: {}", eventId, e.getMessage());
//            throw new RuntimeException("Failed to retrieve sessions", e);
//        }
//    }
}
