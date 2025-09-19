package com.speakerspace.controller;

import com.speakerspace.dto.session.*;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.exception.EventAuthorizationHelper;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.SessionReviewImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.*;

@RestController
@RequestMapping("/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;
    private final EventAuthorizationHelper authorizationHelper;

    @PostMapping("/event/{eventId}/import")
    public ResponseEntity<ImportResultDTO> importSessionsReview(
            @PathVariable String eventId,
            @RequestBody SessionReviewImportRequestDTO importRequest,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
            validateEventIdMatch(eventId, importRequest.eventId());
            return sessionService.importSessionsReview(eventId, importRequest.sessions());
        });
    }

    @PostMapping("/event/{eventId}/import-schedule")
    public ResponseEntity<ImportResultDTO> importSessionsSchedule(
            @PathVariable String eventId,
            @RequestBody SessionScheduleImportRequestDTO importRequest,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
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

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () -> {
            List<SessionReviewImportData> sessions = sessionService.getSessionsReviewAsImportData(eventId);
            List<SessionReviewImportData> mutableSessions = new ArrayList<>(sessions);
            mutableSessions.sort(Comparator.comparing(s ->
                    s.getTitle() != null ? s.getTitle().toLowerCase() : ""
            ));
            return mutableSessions;
        });
    }

    @GetMapping("/event/{eventId}/session/{sessionId}/review")
    public ResponseEntity<SessionReviewImportData> getSessionReviewById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () ->
                sessionService.getSessionById(eventId, sessionId));
    }

    @GetMapping("/event/{eventId}/session/{sessionId}")
    public ResponseEntity<SessionDTO> getSessionDetailById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () ->
                sessionService.getSessionByIdAndEventId(sessionId, eventId));
    }

    @GetMapping("/event/{eventId}/speakers")
    public ResponseEntity<List<Speaker>> getSpeakersByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () ->
                sessionService.getUniqueSpeekersByEventId(eventId));
    }

    @GetMapping("/event/{eventId}/speaker/{speakerId}")
    public ResponseEntity<Speaker> getSpeakerById(
            @PathVariable String eventId,
            @PathVariable String speakerId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () ->
                sessionService.getSpeakerById(eventId, speakerId));
    }

    @GetMapping("/event/{eventId}/speakers-with-sessions")
    public ResponseEntity<List<SpeakerWithSessionsDTO>> getSpeakersWithSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () ->
                sessionService.getSpeakersWithSessionsByEventId(eventId));
    }

    @GetMapping("/event/{eventId}/tracks")
    public ResponseEntity<List<String>> getAvailableTracksForEvent(
            @PathVariable String eventId,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () ->
                sessionService.getDistinctTracksByEventId(eventId));
    }

    @GetMapping("/event/{eventId}/calendar")
    public ResponseEntity<List<SessionDTO>> getSessionsForCalendar(
            @PathVariable String eventId,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
            List<SessionDTO> sessions = sessionService.getSessionsWithScheduleByEventId(eventId);
            List<SessionDTO> mutableSessions = new ArrayList<>(sessions);
            mutableSessions.sort(Comparator.comparing(SessionDTO::start));
            return mutableSessions;
        });
    }

    @PutMapping("/event/{eventId}/session/{sessionId}/schedule")
    public ResponseEntity<SessionDTO> updateSessionSchedule(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            @RequestBody Session session,
            Authentication authentication) throws AccessDeniedException {

        return authorizationHelper.executeWithEventAuthorization(eventId, authentication, () -> {
            if (session.getStart() != null && session.getEnd() != null) {
                if (session.getStart().after(session.getEnd())) {
                    throw new IllegalArgumentException("Start time must be before end time");
                }
            }

            return sessionService.updateSessionSchedule(sessionId, eventId, session);
        });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable String id) {
        boolean deleted = sessionService.deleteSession(id);
        if (!deleted) {
            throw new EntityNotFoundException("Session not found with id: " + id);
        }
        return ResponseEntity.noContent().build();
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
