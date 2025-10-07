package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.*;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.session.Session;
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
    private final SpeakerMapper speakerMapper;
    private final SpeakerRepository speakerRepository;
    private final SessionSpeakerManagementService sessionSpeakerManagementService;

    @Autowired
    private EventService eventService;
    @Autowired
    private SessionMapper sessionMapper;

    public SpeakerDTO createSpeaker(String eventId, SpeakerCreateRequestDTO createRequest) {
        validateBusinessRules(eventId, createRequest);

        Speaker speaker = speakerMapper.buildSpeakerFromRequest(eventId, createRequest);

        Session emptySession = sessionMapper.createEmptySessionForSpeaker(eventId, speaker);

        sessionRepository.saveSession(emptySession);

        return speakerMapper.convertToDTO(speaker);
    }

    public List<SessionDTO> getEmptySessionsForEvent(String eventId) {
        return sessionSpeakerManagementService.getEmptySessionsForEvent(eventId);
    }

    public List<Speaker> findByEventId(String eventId) {
        return sessionRepository.findUniqueSpeekersByEventId(eventId);
    }

    public Speaker findByIdAndEventId(String speakerId, String eventId) {
        List<Speaker> speakers = findByEventId(eventId);
        return speakers.stream()
                .filter(speaker -> speakerId.equals(speaker.getId()))
                .findFirst()
                .orElse(null);
    }

    public Speaker getSpeakerByEmailAndEventId(String email, String eventId) {
        List<Speaker> speakers = findByEventId(eventId);
        return speakers.stream()
                .filter(speaker -> email.equalsIgnoreCase(speaker.getEmail()))
                .findFirst()
                .orElse(null);
    }

    public List<SessionImportData> getSessionsByEventAndSpeakerEmail(String eventId, String speakerEmail) {
        List<Session> sessions = sessionRepository.findByEventIdAndSpeakerEmail(eventId, speakerEmail);
        return sessions.stream()
                .map(sessionMapper::toSessionImportData)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public boolean deleteSpeaker(String id) {
        Speaker existingSpeaker = speakerRepository.findSpeakerById(id);
        if (existingSpeaker == null) {
            return false;
        }

        return speakerRepository.deleteSpeaker(id);
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
}
