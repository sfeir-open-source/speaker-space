package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.ImportResultDTO;
import com.speakerspace.dto.session.SessionImportRequestDTO;
import com.speakerspace.dto.session.SpeakerWithSessionsDTO;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.security.AuthenticationHelper;
import com.speakerspace.utils.email.EmailEncoder;
import com.speakerspace.utils.email.EmailValidator;
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
    public ResponseEntity<ImportResultDTO> importSessions(
            @PathVariable String eventId,
            @RequestBody SessionImportRequestDTO importRequest,
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

            ImportResultDTO result = sessionService.importSessions(eventId, importRequest.getSessions());
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SessionImportData>> getSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            List<SessionImportData> sessions = sessionService.getSessionsAsImportData(eventId);
            sessions.sort(Comparator.comparing(s -> s.getTitle() != null ? s.getTitle().toLowerCase() : ""));
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/session/{sessionId}")
    public ResponseEntity<SessionImportData> getSessionById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            SessionImportData sessionData = sessionService.getSessionById(eventId, sessionId);
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

    @GetMapping("/event/{eventId}/speaker/{encodedEmail}")
    public ResponseEntity<Speaker> getSpeakerByEmail(
            @PathVariable String eventId,
            @PathVariable String encodedEmail,
            HttpServletRequest request,
            Authentication authentication) {

        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            String decodedEmail = EmailEncoder.decodeFromBase64(encodedEmail);
            if (!EmailValidator.isValid(decodedEmail)) {
                return ResponseEntity.badRequest().build();
            }

            Speaker speaker = sessionService.getSpeakerByEmail(eventId, decodedEmail);
            return speaker != null ? ResponseEntity.ok(speaker) : ResponseEntity.notFound().build();

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
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
}
