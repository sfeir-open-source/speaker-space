package com.speakerspace.controller;

import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.exception.EventAuthorizationHelper;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.service.SpeakerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/speaker")
@RequiredArgsConstructor
public class SpeakerController {

    private final SpeakerService speakerService;
    private final SpeakerMapper speakerMapper;
    private final EventAuthorizationHelper authorizationHelper;

    @PostMapping("/event/{eventId}")
    public ResponseEntity<SpeakerDTO> createSpeaker(
            @PathVariable String eventId,
            @RequestBody SpeakerDTO speakerDTO,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
            Speaker speaker = speakerMapper.convertToEntity(speakerDTO);
            speaker.setEventId(eventId);

            Speaker savedSpeaker = speakerService.saveSpeaker(speaker);
            return speakerMapper.convertToDTO(savedSpeaker);
        });
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SpeakerDTO>> getSpeakersByEvent(
            @PathVariable String eventId,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
            List<Speaker> speakers = speakerService.findByEventId(eventId);
            return speakers.stream()
                    .map(speakerMapper::convertToDTO)
                    .collect(Collectors.toList());
        });
    }

    @GetMapping("/{speakerId}")
    public ResponseEntity<SpeakerDTO> getSpeaker(
            @PathVariable String speakerId,
            Authentication authentication) throws AccessDeniedException {

        Speaker speaker = speakerService.findById(speakerId);
        if (speaker == null) {
            throw new EntityNotFoundException("Speaker not found with id: " + speakerId);
        }

        return authorizationHelper.executeWithEventAuthorization(speaker.getEventId(), authentication, () ->
                speakerMapper.convertToDTO(speaker));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpeaker(@PathVariable String id) {
        boolean deleted = speakerService.deleteSpeaker(id);
        if (!deleted) {
            throw new EntityNotFoundException("Speaker not found with id: " + id);
        }
        return ResponseEntity.noContent().build();
    }
}
