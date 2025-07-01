package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.security.AuthenticationHelper;
import com.speakerspace.service.EventService;
import com.speakerspace.service.SpeakerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/speaker")
public class SpeakerController {

    private final SpeakerService speakerService;
    private final EventService eventService;
    private final AuthenticationHelper authHelper;

    public SpeakerController(SpeakerService speakerService, EventService eventService, AuthenticationHelper authHelper) {
        this.speakerService = speakerService;
        this.eventService = eventService;
        this.authHelper = authHelper;
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ResponseEntity<List<SpeakerDTO>>> getSpeakersByEvent(
            @PathVariable String eventId,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            List<Speaker> speakers = speakerService.findByEventId(eventId);
            List<SpeakerDTO> speakerDTOs = speakers.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(speakerDTOs);
        });
    }

    @GetMapping("/{speakerId}")
    public ResponseEntity<ResponseEntity<SpeakerDTO>> getSpeaker(
            @PathVariable String speakerId,
            Authentication authentication) {

        Speaker speaker = speakerService.findById(speakerId);
        if (speaker == null) {
            return ResponseEntity.notFound().build();
        }

        return executeWithEventAuthorization(speaker.getEventId(), authentication, () -> {
            SpeakerDTO speakerDTO = convertToDTO(speaker);
            return ResponseEntity.ok(speakerDTO);
        });
    }

    @PostMapping("/event/{eventId}")
    public ResponseEntity<ResponseEntity<SpeakerDTO>> createSpeaker(
            @PathVariable String eventId,
            @RequestBody SpeakerDTO speakerDTO,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            Speaker speaker = convertToEntity(speakerDTO);
            speaker.setEventId(eventId);

            Speaker savedSpeaker = speakerService.saveSpeaker(speaker);
            SpeakerDTO resultDTO = convertToDTO(savedSpeaker);

            return ResponseEntity.status(HttpStatus.CREATED).body(resultDTO);
        });
    }

    private <T> ResponseEntity<T> executeWithEventAuthorization(String eventId, Authentication authentication,
                                                                Supplier<T> operation) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            EventDTO existingEvent = eventService.getEventById(eventId);
            if (existingEvent == null) {
                return ResponseEntity.notFound().build();
            }

            if (!authHelper.isUserAuthorized(authentication, existingEvent.getUserCreateId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            T result = operation.get();
            return result != null ? ResponseEntity.ok(result) : ResponseEntity.notFound().build();

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private SpeakerDTO convertToDTO(Speaker speaker) {
        SpeakerDTO dto = new SpeakerDTO();
        dto.setId(speaker.getId());
        dto.setName(speaker.getName());
        dto.setBio(speaker.getBio());
        dto.setCompany(speaker.getCompany());
        dto.setReferences(speaker.getReferences());
        dto.setPicture(speaker.getPicture());
        dto.setLocation(speaker.getLocation());
        dto.setEmail(speaker.getEmail());
        dto.setSocialLinks(speaker.getSocialLinks());
        return dto;
    }

    private Speaker convertToEntity(SpeakerDTO dto) {
        Speaker speaker = new Speaker();
        speaker.setId(dto.getId());
        speaker.setName(dto.getName());
        speaker.setBio(dto.getBio());
        speaker.setCompany(dto.getCompany());
        speaker.setReferences(dto.getReferences());
        speaker.setPicture(dto.getPicture());
        speaker.setLocation(dto.getLocation());
        speaker.setEmail(dto.getEmail());
        speaker.setSocialLinks(dto.getSocialLinks());
        return speaker;
    }
}
