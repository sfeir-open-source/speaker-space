package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.SpeakerCreateRequestDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.session.Speaker;
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

    @Autowired
    private EventService eventService;

    private final SpeakerRepository speakerRepository;

    private final SpeakerMapper speakerMapper;

    public Speaker saveSpeaker(Speaker speaker) {
        return speakerRepository.saveSpeaker(speaker);
    }

    public Speaker findById(String id) {
        return speakerRepository.findSpeakerById(id);
    }

    public List<Speaker> findByIds(List<String> ids) {
        return speakerRepository.findByIds(ids);
    }

    public List<Speaker> findByEventId(String eventId) {
        return speakerRepository.findByEventId(eventId);
    }

    public boolean deleteSpeaker(String id) {
        Speaker existingSpeaker = speakerRepository.findSpeakerById(id);
        if (existingSpeaker == null) {
            return false;
        }
        return speakerRepository.deleteSpeaker(id);
    }

    public SpeakerDTO createSpeaker(String eventId, SpeakerCreateRequestDTO createRequest) {
        validateBusinessRules(eventId, createRequest);

        String speakerId = generateSpeakerId();
        Speaker speaker = speakerMapper.convertFromCreateRequest(speakerId, eventId, createRequest);

        Speaker savedSpeaker = speakerRepository.saveSpeaker(speaker);

        log.info("Successfully created speaker {} '{}' for event {}",
                speakerId, createRequest.name(), eventId);

        return speakerMapper.convertToDTO(savedSpeaker);
    }

    public String saveOrUpdateSpeaker(Speaker speaker, String eventId) {
        speaker.setEventId(eventId);

        if (speaker.getId() != null && speakerRepository.speakerExistsById(speaker.getId())) {
            Speaker existingSpeaker = speakerRepository.findSpeakerById(speaker.getId());
            Speaker mergedSpeaker = mergeSpeakerData(existingSpeaker, speaker);
            return speakerRepository.saveSpeaker(mergedSpeaker).getId();
        } else {
            return speakerRepository.saveSpeaker(speaker).getId();
        }
    }

    public List<String> processSpeakers(List<Speaker> speakers, String eventId) {
        if (speakers == null || speakers.isEmpty()) {
            return new ArrayList<>();
        }

        return speakers.stream()
                .map(speaker -> saveOrUpdateSpeaker(speaker, eventId))
                .collect(Collectors.toList());
    }

    private Speaker mergeSpeakerData(Speaker existing, Speaker incoming) {
        Speaker merged = new Speaker();
        merged.setId(existing.getId());
        merged.setEventId(existing.getEventId());

        merged.setName(isNotEmpty(incoming.getName()) ? incoming.getName() : existing.getName());
        merged.setBio(isNotEmpty(incoming.getBio()) ? incoming.getBio() : existing.getBio());
        merged.setCompany(isNotEmpty(incoming.getCompany()) ? incoming.getCompany() : existing.getCompany());
        merged.setPicture(isNotEmpty(incoming.getPicture()) ? incoming.getPicture() : existing.getPicture());
        merged.setLocation(isNotEmpty(incoming.getLocation()) ? incoming.getLocation() : existing.getLocation());
        merged.setEmail(isNotEmpty(incoming.getEmail()) ? incoming.getEmail() : existing.getEmail());
        merged.setReferences(incoming.getReferences() != null ? incoming.getReferences() : existing.getReferences());

        Set<String> mergedSocialLinks = new HashSet<>();
        if (existing.getSocialLinks() != null) {
            mergedSocialLinks.addAll(existing.getSocialLinks());
        }
        if (incoming.getSocialLinks() != null) {
            mergedSocialLinks.addAll(incoming.getSocialLinks());
        }
        merged.setSocialLinks(new ArrayList<>(mergedSocialLinks));

        return merged;
    }

    private boolean isNotEmpty(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private void validateBusinessRules(String eventId, SpeakerCreateRequestDTO createRequest) {
        EventDTO event = eventService.getEventById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        List<Speaker> existingSpeakers = speakerRepository.findByEmailAndEventId(
                createRequest.email().toLowerCase().trim(), eventId);

        if (!existingSpeakers.isEmpty()) {
            throw new IllegalArgumentException(
                    "A speaker with email '" + createRequest.email() +
                            "' already exists in this event");
        }
    }

    private String generateSpeakerId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
