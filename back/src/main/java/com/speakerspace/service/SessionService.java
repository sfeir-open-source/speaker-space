package com.speakerspace.service;

import com.speakerspace.dto.session.SessionImportDTO;
import com.speakerspace.mapper.SessionMapper;
import com.speakerspace.model.Event;
import com.speakerspace.model.session.ImportResult;
import com.speakerspace.model.session.Session;
import com.speakerspace.repository.EventRepository;
import com.speakerspace.repository.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SessionService {

    private static final Logger logger = LoggerFactory.getLogger(SessionService.class);

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private SessionMapper sessionMapper;

    @Transactional
    public ImportResult importSessionsFromJson(String eventId, List<SessionImportDTO> sessionImports) {
        Event event = eventRepository.findById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found with ID: " + eventId);
        }

        ImportResult result = new ImportResult();
        List<String> errors = new ArrayList<>();
        int successCount = 0;

        for (SessionImportDTO sessionImport : sessionImports) {
            try {
                validateSessionData(sessionImport);

                Session session = sessionMapper.convertImportDTOToEntity(sessionImport);
                session.setEventId(eventId);

                if (session.getId() == null || session.getId().isEmpty()) {
                    session.setId(generateSessionId());
                }

                sessionRepository.save(session);
                successCount++;

                logger.info("Session imported successfully: {} for event: {}",
                        session.getTitle(), eventId);

            } catch (Exception e) {
                String errorMsg = String.format("Failed to import session '%s': %s",
                        sessionImport.getTitle(), e.getMessage());
                errors.add(errorMsg);
                logger.error(errorMsg, e);
            }
        }

        result.setSuccessCount(successCount);
        result.setTotalCount(sessionImports.size());
        result.setErrors(errors);

        return result;
    }

    private void validateSessionData(SessionImportDTO session) {
        if (session.getTitle() == null || session.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Session title is required");
        }

        if (session.getSessionAbstract() == null || session.getSessionAbstract().trim().isEmpty()) {
            throw new IllegalArgumentException("Session abstract is required");
        }

        if (session.getDeliberationStatus()) {
            throw new IllegalArgumentException("Session title is required");
        }

        if (session.getConfirmationStatus()) {
            throw new IllegalArgumentException("Session abstract is required");
        }

        if (session.getLevel() == null || session.getLevel().trim().isEmpty()) {
            throw new IllegalArgumentException("Session Level is required");
        }

        if (session.getReferences() == null || session.getReferences().trim().isEmpty()) {
            throw new IllegalArgumentException("Session references is required");
        }

        if (session.getFormats() == null || session.getFormats().toString().isEmpty()) {
            throw new IllegalArgumentException("Session formats is required");
        }

        if (session.getCategories() == null || session.getCategories().toString().isEmpty()) {
            throw new IllegalArgumentException("Session categories is required");
        }

        if (session.getTags() == null || session.getTags().toString().isEmpty()) {
            throw new IllegalArgumentException("Session tags is required");
        }

        if (session.getLanguages() == null || session.getLanguages().toString().isEmpty()) {
            throw new IllegalArgumentException("Session languages is required");
        }

        if (session.getSpeakers() == null || session.getSpeakers().toString().isEmpty()) {
            throw new IllegalArgumentException("Session speakers is required");
        }

        if (session.getReviews() == null || session.getReviews().toString().isEmpty()) {
            throw new IllegalArgumentException("Session reviews is required");
        }

    }

    private String generateSessionId() {
        return UUID.randomUUID().toString();
    }
}
