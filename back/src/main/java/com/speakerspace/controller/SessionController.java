package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.*;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.SessionReviewImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.security.AuthenticationHelper;
import com.speakerspace.utils.email.UserEmailExtractor;
import com.speakerspace.service.EventService;
import com.speakerspace.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.function.Supplier;

@RestController
@RequestMapping("/session")
public class SessionController {

    private final EventService eventService;
    private final SessionService sessionService;
    private final AuthenticationHelper authHelper;
    private final UserEmailExtractor emailExtractor;

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

        return executeWithEventAuthorization(eventId, authentication, () -> {
            validateEventIdMatch(eventId, importRequest.getEventId());
            return sessionService.importSessionsReview(eventId, importRequest.getSessions());
        });
    }

    @PostMapping("/event/{eventId}/import-schedule")
    public ResponseEntity<ImportResultDTO> importSessionsSchedule(
            @PathVariable String eventId,
            @RequestBody SessionScheduleImportRequestDTO importRequest,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            validateEventIdMatch(eventId, importRequest.getEventId());
            validateSessionsData(importRequest.getSessions());
            return sessionService.importSessionsSchedule(eventId, importRequest.getSessions());
        });
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SessionReviewImportData>> getSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return executeWithUserAuthentication(request, authentication, () -> {
            List<SessionReviewImportData> sessions = sessionService.getSessionsReviewAsImportData(eventId);
            sessions.sort(Comparator.comparing(s -> s.getTitle() != null ? s.getTitle().toLowerCase() : ""));
            return sessions;
        });
    }

    @GetMapping("/event/{eventId}/session/{sessionId}/review")
    public ResponseEntity<SessionReviewImportData> getSessionReviewById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            HttpServletRequest request,
            Authentication authentication) {

        return executeWithUserAuthentication(request, authentication, () ->
                sessionService.getSessionById(eventId, sessionId));
    }

    @GetMapping("/event/{eventId}/session/{sessionId}")
    public ResponseEntity<SessionDTO> getSessionDetailById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () ->
                sessionService.getSessionByIdAndEventId(sessionId, eventId));
    }

    @GetMapping("/event/{eventId}/speakers")
    public ResponseEntity<List<Speaker>> getSpeakersByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return executeWithUserAuthentication(request, authentication, () ->
                sessionService.getUniqueSpeekersByEventId(eventId));
    }

    @GetMapping("/event/{eventId}/speaker/{speakerId}")
    public ResponseEntity<Speaker> getSpeakerById(
            @PathVariable String eventId,
            @PathVariable String speakerId,
            HttpServletRequest request,
            Authentication authentication) {

        return executeWithUserAuthentication(request, authentication, () ->
                sessionService.getSpeakerById(eventId, speakerId));
    }

    @GetMapping("/event/{eventId}/speakers-with-sessions")
    public ResponseEntity<List<SpeakerWithSessionsDTO>> getSpeakersWithSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return executeWithUserAuthentication(request, authentication, () ->
                sessionService.getSpeakersWithSessionsByEventId(eventId));
    }

    @GetMapping("/event/{eventId}/tracks")
    public ResponseEntity<List<String>> getAvailableTracksForEvent(
            @PathVariable String eventId,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            List<String> tracks = sessionService.getDistinctTracksByEventId(eventId);
            return tracks;
        });
    }

    @GetMapping("/event/{eventId}/calendar")
    public ResponseEntity<List<SessionDTO>> getSessionsForCalendar(
            @PathVariable String eventId,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            List<SessionDTO> sessions = sessionService.getSessionsWithScheduleByEventId(eventId);
            sessions.sort(Comparator.comparing(SessionDTO::getStart));
            return sessions;
        });
    }

    @PutMapping("/event/{eventId}/session/{sessionId}/schedule")
    public ResponseEntity<SessionDTO> updateSessionSchedule(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            @RequestBody Session session,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            if (session.getStart() != null && session.getEnd() != null) {
                if (session.getStart().after(session.getEnd())) {
                    throw new IllegalArgumentException("Start time must be before end time");
                }
            }

            SessionDTO updatedSession = sessionService.updateSessionSchedule(
                    sessionId, eventId, session);

            return updatedSession;
        });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable String id) {
        boolean deleted = sessionService.deleteSession(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
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

    private <T> ResponseEntity<T> executeWithUserAuthentication(HttpServletRequest request, Authentication authentication,
                                                                Supplier<T> operation) {
        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            T result = operation.get();
            return result != null ? ResponseEntity.ok(result) : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private void validateEventIdMatch(String pathEventId, String bodyEventId) {
        if (!pathEventId.equals(bodyEventId)) {
            throw new IllegalArgumentException("Event ID mismatch");
        }
    }

    private void validateSessionsData(List<SessionScheduleImportDataDTO> sessions) {
        if (sessions == null || sessions.isEmpty()) {
            throw new IllegalArgumentException("No sessions data provided");
        }
    }
}
