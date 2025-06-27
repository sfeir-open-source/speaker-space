package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.*;
import com.speakerspace.model.session.SessionReviewImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.security.AuthenticationHelper;
import com.speakerspace.utils.email.UserEmailExtractor;
import com.speakerspace.service.EventService;
import com.speakerspace.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/session")
public class SessionController {

    private final EventService eventService;
    private final SessionService sessionService;
    private final AuthenticationHelper authHelper;
    private final UserEmailExtractor emailExtractor;
    private static final Logger logger = LoggerFactory.getLogger(SessionController.class);

    public SessionController(EventService eventService, SessionService sessionService,
                             AuthenticationHelper authHelper, UserEmailExtractor emailExtractor) {
        this.eventService = eventService;
        this.sessionService = sessionService;
        this.authHelper = authHelper;
        this.emailExtractor = emailExtractor;
    }

    @PostMapping("/event/{eventId}/import")
    public ResponseEntity<ImportResultDTO> importSessionsReview(
            @PathVariable String eventId,
            @RequestBody SessionReviewImportRequestDTO importRequest,
            Authentication authentication) {

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

            if (!eventId.equals(importRequest.getEventId())) {
                return ResponseEntity.badRequest().build();
            }

            ImportResultDTO result = sessionService.importSessionsReview(eventId, importRequest.getSessions());
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SessionReviewImportData>> getSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            List<SessionReviewImportData> sessions = sessionService.getSessionsReviewAsImportData(eventId);
            sessions.sort(Comparator.comparing(s -> s.getTitle() != null ? s.getTitle().toLowerCase() : ""));
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/session/{sessionId}")
    public ResponseEntity<SessionReviewImportData> getSessionById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            SessionReviewImportData sessionData = sessionService.getSessionById(eventId, sessionId);
            return sessionData != null ? ResponseEntity.ok(sessionData) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/speakers")
    public ResponseEntity<List<Speaker>> getSpeakersByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            List<Speaker> speakers = sessionService.getUniqueSpeekersByEventId(eventId);
            return ResponseEntity.ok(speakers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/speaker/{speakerId}")
    public ResponseEntity<Speaker> getSpeakerById(
            @PathVariable String eventId,
            @PathVariable String speakerId,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            Speaker speaker = sessionService.getSpeakerById(eventId, speakerId);
            return speaker != null ? ResponseEntity.ok(speaker) : ResponseEntity.notFound().build();

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/speakers-with-sessions")
    public ResponseEntity<List<SpeakerWithSessionsDTO>> getSpeakersWithSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            List<SpeakerWithSessionsDTO> speakers = sessionService.getSpeakersWithSessionsByEventId(eventId);
            return ResponseEntity.ok(speakers);
        } catch (Exception e) {
            logger.error("Error retrieving speakers with sessions for event {}: {}", eventId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.emptyList());
        }
    }

    @PostMapping("/event/{eventId}/import-schedule")
    public ResponseEntity<ImportResultDTO> importSessionsSchedule(
            @PathVariable String eventId,
            @RequestBody SessionScheduleImportRequestDTO importRequest,
            Authentication authentication) {

        if (authentication == null) {
            logger.warn("Unauthorized access attempt: no authentication");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        logger.info("User " + authentication.getName() + " requests import for event " + eventId);

        try {
            EventDTO existingEvent = eventService.getEventById(eventId);
            if (existingEvent == null) {
                logger.warn("Event not found: " + eventId);
                return ResponseEntity.notFound().build();
            }

            if (!authHelper.isUserAuthorized(authentication, existingEvent.getUserCreateId())) {
                logger.warn("Forbidden: User " + authentication.getName() + " not authorized for event owner " + existingEvent.getUserCreateId());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (!eventId.equals(importRequest.getEventId())) {
                logger.warn("Bad request: eventId in path and body do not match");
                return ResponseEntity.badRequest().build();
            }

            ImportResultDTO result = sessionService.importSessionsSchedule(eventId, importRequest.getSessions());
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            logger.warn("Validation error during import: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Internal error during import", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
