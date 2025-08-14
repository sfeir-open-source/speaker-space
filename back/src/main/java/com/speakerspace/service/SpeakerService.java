package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.*;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.SpeakerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpeakerService {

    private final SessionRepository sessionRepository;
    private final SessionService sessionService;
    private final SpeakerMapper speakerMapper;
    private final SpeakerRepository speakerRepository;
    private final UserReferenceCleanupService userReferenceCleanupService;


    @Autowired
    private EventService eventService;

    public boolean deleteSpeaker(String id) {
        Speaker existingSpeaker = speakerRepository.findSpeakerById(id);
        if (existingSpeaker == null) {
            return false;
        }

        boolean deleted = speakerRepository.deleteSpeaker(id);

        if (deleted) {
            userReferenceCleanupService.removeSpeakerIdFromAllUsers(id);
        }

        return deleted;
    }

    public SpeakerDTO createSpeaker(String eventId, SpeakerCreateRequestDTO createRequest) {
        validateBusinessRules(eventId, createRequest);

        String speakerId = generateSpeakerId();

        Speaker speaker = new Speaker();
        speaker.setId(speakerId);
        speaker.setName(createRequest.name().trim());
        speaker.setBio(trimOrNull(createRequest.bio()));
        speaker.setCompany(trimOrNull(createRequest.company()));
        speaker.setReferences(trimOrNull(createRequest.references()));
        speaker.setEmail(createRequest.email().toLowerCase().trim());
        speaker.setEventId(eventId);
        speaker.setPicture(trimOrNull(createRequest.picture()));
        speaker.setLocation(trimOrNull(createRequest.location()));

        List<String> socialLinks = createRequest.socialLinks() != null ?
                createRequest.socialLinks().stream()
                        .filter(link -> link != null && !link.trim().isEmpty())
                        .map(String::trim)
                        .distinct()
                        .collect(Collectors.toList()) :
                new ArrayList<>();
        speaker.setSocialLinks(socialLinks);

        log.info("Successfully created speaker {} '{}' for event {}",
                speakerId, createRequest.name(), eventId);

        return speakerMapper.convertToDTO(speaker);
    }

    public List<Speaker> findByEventId(String eventId) {
        return sessionRepository.findUniqueSpeekersByEventId(eventId);
    }

    public Speaker findById(String speakerId) {
        throw new UnsupportedOperationException(
                "Use findByIdAndEventId instead - speaker lookup requires eventId");
    }

    public Speaker findByIdAndEventId(String speakerId, String eventId) {
        List<Speaker> speakers = findByEventId(eventId);
        return speakers.stream()
                .filter(speaker -> speakerId.equals(speaker.getId()))
                .findFirst()
                .orElse(null);
    }

    public List<SessionImportData> getSessionsByEventAndSpeakerEmail(String eventId, String speakerEmail) {
        return sessionService.getSessionsByEventAndSpeakerEmail(eventId, speakerEmail);
    }

    public SessionImportData getSessionByIdForSpeaker(String eventId, String sessionId, String speakerEmail) {
        return sessionService.getSessionByIdForSpeaker(eventId, sessionId, speakerEmail);
    }

    public Speaker getSpeakerByEmailAndEventId(String email, String eventId) {
        return sessionService.getSpeakerByEmailAndEventId(email, eventId);
    }

    private void validateBusinessRules(String eventId, SpeakerCreateRequestDTO createRequest) {
        EventDTO event = eventService.getEventById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        Speaker existingSpeaker = getSpeakerByEmailAndEventId(
                createRequest.email().toLowerCase().trim(), eventId);

        if (existingSpeaker != null) {
            throw new IllegalArgumentException(
                    "A speaker with email '" + createRequest.email() +
                            "' already exists in this event");
        }
    }

    private String generateSpeakerId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private String trimOrNull(String value) {
        return value != null && !value.trim().isEmpty() ? value.trim() : null;
    }
}
