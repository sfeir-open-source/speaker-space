package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.mapper.session.SpeakerMapper;
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
    private final SpeakerMapper speakerMapper;

    public SpeakerController(SpeakerService speakerService, EventService eventService, AuthenticationHelper authHelper, SpeakerMapper speakerMapper) {
        this.speakerService = speakerService;
        this.eventService = eventService;
        this.authHelper = authHelper;
        this.speakerMapper = speakerMapper;
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<ResponseEntity<List<SpeakerDTO>>> getSpeakersByEvent(
            @PathVariable String eventId,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            List<Speaker> speakers = speakerService.findByEventId(eventId);
            List<SpeakerDTO> speakerDTOs = speakers.stream()
                    .map(speakerMapper::convertToDTO)
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
            SpeakerDTO speakerDTO = speakerMapper.convertToDTO(speaker);
            return ResponseEntity.ok(speakerDTO);
        });
    }

    @PostMapping("/event/{eventId}")
    public ResponseEntity<ResponseEntity<SpeakerDTO>> createSpeaker(
            @PathVariable String eventId,
            @RequestBody SpeakerDTO speakerDTO,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            Speaker speaker = speakerMapper.convertToEntity(speakerDTO);
            speaker.setEventId(eventId);

            Speaker savedSpeaker = speakerService.saveSpeaker(speaker);
            SpeakerDTO resultDTO = speakerMapper.convertToDTO(savedSpeaker);

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpeaker(@PathVariable String id) {
        boolean deleted = speakerService.deleteSpeaker(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
