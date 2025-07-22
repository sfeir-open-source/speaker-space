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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.function.Supplier;

@RestController
@RequestMapping("/session")
@RequiredArgsConstructor
public class SessionController {

    private final EventService eventService;
    private final SessionService sessionService;
    private final AuthenticationHelper authHelper;
    private final UserEmailExtractor emailExtractor;

    @PostMapping("/event/{eventId}/import")
    public ResponseEntity<ImportResultDTO> importSessionsReview(
            @PathVariable String eventId,
            @RequestBody SessionReviewImportRequestDTO importRequest,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            validateEventIdMatch(eventId, importRequest.eventId());
            return sessionService.importSessionsReview(eventId, importRequest.sessions());
        });
    }

    @PostMapping("/event/{eventId}/import-schedule")
    public ResponseEntity<ImportResultDTO> importSessionsSchedule(
            @PathVariable String eventId,
            @RequestBody SessionScheduleImportRequestDTO importRequest,
            Authentication authentication) {

        return executeWithEventAuthorization(eventId, authentication, () -> {
            validateEventIdMatch(eventId, importRequest.eventId());
            validateSessionsData(importRequest.sessions());
            return sessionService.importSessionsSchedule(eventId, importRequest.sessions());
        });
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SessionReviewImportData>> getSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return executeWithUserAuthentication(request, authentication, () -> {
            try {
                List<SessionReviewImportData> sessions = sessionService.getSessionsReviewAsImportData(eventId);

                List<SessionReviewImportData> mutableSessions = new ArrayList<>(sessions);
                mutableSessions.sort(Comparator.comparing(s ->
                        s.getTitle() != null ? s.getTitle().toLowerCase() : ""
                ));

                return mutableSessions;
            } catch (Exception e) {
                System.err.println("Error fetching sessions for event " + eventId + ": " + e.getMessage());
                e.printStackTrace();
                throw e;
            }
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
            try {
                List<SessionDTO> sessions = sessionService.getSessionsWithScheduleByEventId(eventId);

                List<SessionDTO> mutableSessions = new ArrayList<>(sessions);
                mutableSessions.sort(Comparator.comparing(SessionDTO::start));

                return mutableSessions;
            } catch (Exception e) {
                System.err.println("Error fetching calendar sessions for event " + eventId + ": " + e.getMessage());
                e.printStackTrace();
                throw e;
            }
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

            if (!authHelper.isUserAuthorized(authentication, existingEvent.userCreateId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            T result = operation.get();
            return result != null ? ResponseEntity.ok(result) : ResponseEntity.notFound().build();

        } catch (IllegalArgumentException e) {
            System.err.println("Bad request error: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Internal server error: " + e.getMessage());
            e.printStackTrace();
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
        } catch (UnsupportedOperationException e) {
            System.err.println("Immutable collection operation error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            System.err.println("Error in user authentication operation: " + e.getMessage());
            e.printStackTrace();
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
