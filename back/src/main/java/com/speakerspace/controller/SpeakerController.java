package com.speakerspace.controller;

import com.speakerspace.dto.session.SpeakerCreateRequestDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.exception.EventAuthorizationHelper;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.service.SpeakerService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    @PostMapping("/event/{eventId}/new-speaker")
    public ResponseEntity<ResponseEntity<SpeakerDTO>> createNewSpeaker(
            @PathVariable @NotBlank String eventId,
            @RequestBody @Valid SpeakerCreateRequestDTO createRequest,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
            SpeakerDTO createdSpeaker = speakerService.createSpeaker(eventId, createRequest);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdSpeaker);
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

    @GetMapping("/{speakerId}/event/{eventId}")
    public ResponseEntity<SpeakerDTO> getSpeaker(
            @PathVariable String speakerId,
            @PathVariable String eventId,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
            Speaker speaker = speakerService.findByIdAndEventId(speakerId, eventId);
            if (speaker == null) {
                throw new EntityNotFoundException("Speaker not found with id: " + speakerId);
            }
            return speakerMapper.convertToDTO(speaker);
        });
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
