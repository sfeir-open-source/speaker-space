package com.speakerspace.service;

import com.speakerspace.dto.session.SessionCreateRequestDTO;
import com.speakerspace.dto.session.SessionDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.mapper.session.CategoryMapper;
import com.speakerspace.mapper.session.FormatMapper;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.model.session.Session;
import com.speakerspace.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionSpeakerManagementService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final FormatMapper formatMapper;
    private final CategoryMapper categoryMapper;

    public SessionDTO updateEmptySession(String sessionId, SessionCreateRequestDTO sessionData) {
        Session existingSession = sessionRepository.findSessionById(sessionId)
                .orElseThrow(() -> new EntityNotFoundException("Session not found: " + sessionId));

        if (existingSession.getTitle() != null && !existingSession.getTitle().trim().isEmpty()) {
            throw new IllegalStateException("Cannot update a session that already has content");
        }

        updateSessionWithData(existingSession, sessionData);

        sessionRepository.saveSession(existingSession);

        return sessionMapper.convertToDTO(existingSession);
    }

    public List<SessionDTO> getEmptySessionsForEvent(String eventId) {
        return sessionRepository.findByEventId(eventId).stream()
                .filter(this::isEmptySession)
                .map(sessionMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<String> findEmptySessionForSpeakers(List<SpeakerDTO> speakers, String eventId) {
        if (speakers == null || speakers.isEmpty()) {
            return Optional.empty();
        }

        Set<String> speakerEmails = speakers.stream()
                .map(SpeakerDTO::email)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return sessionRepository.findByEventId(eventId).stream()
                .filter(this::isEmptySession)
                .filter(session -> hasMatchingSpeaker(session, speakerEmails))
                .map(Session::getId)
                .findFirst();
    }

    private void updateSessionWithData(Session session, SessionCreateRequestDTO sessionData) {
        session.setTitle(sessionData.title().trim());
        session.setAbstractText(trimOrNull(sessionData.abstractText()));
        session.setReferences(trimOrNull(sessionData.references()));
        session.setLevel(sessionData.level());
        session.setTrack(sessionData.track());
        session.setDeliberationStatus(sessionData.deliberationStatus() != null ?
                sessionData.deliberationStatus() : "ACCEPTED");
        session.setConfirmationStatus(sessionData.confirmationStatus() != null ?
                sessionData.confirmationStatus() : "CONFIRMED");

        if (sessionData.start() != null) {
            session.setStart(sessionData.start());
        }
        if (sessionData.end() != null) {
            session.setEnd(sessionData.end());
        }

        session.setLanguages(sessionData.languages() != null ? sessionData.languages() : new ArrayList<>());

        if (sessionData.formats() != null) {
            session.setFormats(sessionData.formats().stream()
                    .map(formatMapper::convertToEntity)
                    .collect(Collectors.toList()));
        }

        if (sessionData.categories() != null) {
            session.setCategories(sessionData.categories().stream()
                    .map(categoryMapper::convertToEntity)
                    .collect(Collectors.toList()));
        }

        session.setUpdatedAt(new Date());
    }

    private boolean isEmptySession(Session session) {
        return session.getTitle() == null || session.getTitle().trim().isEmpty();
    }

    private boolean hasMatchingSpeaker(Session session, Set<String> speakerEmails) {
        return session.getSpeakers() != null &&
                session.getSpeakers().stream()
                        .anyMatch(speaker -> speakerEmails.contains(speaker.getEmail()));
    }

    private String trimOrNull(String value) {
        return value != null && !value.trim().isEmpty() ? value.trim() : null;
    }


}
