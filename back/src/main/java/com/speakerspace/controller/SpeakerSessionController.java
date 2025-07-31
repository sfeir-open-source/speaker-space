package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.exception.EventAuthorizationHelper;
import com.speakerspace.model.session.SessionReviewImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.service.SpeakerService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/speaker-sessions")
@RequiredArgsConstructor
public class SpeakerSessionController {

    private final SpeakerService speakerService;
    private final EventAuthorizationHelper authorizationHelper;

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SessionReviewImportData>> getMySessions(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () -> {
            String userEmail = extractEmailFromAuthentication(authentication);

            List<SessionReviewImportData> sessions = speakerService.getSessionsByEventAndSpeakerEmail(eventId, userEmail);

            List<SessionReviewImportData> mutableSessions = new ArrayList<>(sessions);
            mutableSessions.sort(Comparator.comparing(s ->
                    s.getTitle() != null ? s.getTitle().toLowerCase() : ""
            ));
            return mutableSessions;
        });
    }

    @GetMapping("/event/{eventId}/session/{sessionId}")
    public ResponseEntity<SessionReviewImportData> getMySessionById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () -> {
            String userEmail = extractEmailFromAuthentication(authentication);

            SessionReviewImportData session = speakerService.getSessionByIdForSpeaker(eventId, sessionId, userEmail);

            if (session == null) {
                throw new EntityNotFoundException("Session not found or not accessible");
            }

            return session;
        });
    }

    @GetMapping("/event/{eventId}/my-profile")
    public ResponseEntity<Speaker> getMyProfile(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () -> {
            String userEmail = extractEmailFromAuthentication(authentication);

            Speaker speaker = speakerService.getSpeakerByEmailAndEventId(userEmail, eventId);

            if (speaker == null) {
                throw new EntityNotFoundException("Speaker profile not found for current user in this event");
            }

            return speaker;
        });
    }

    private String extractEmailFromAuthentication(org.springframework.security.core.Authentication authentication) {
        if (authentication.getPrincipal() instanceof FirebaseToken token) {
            return token.getEmail();
        }

        if (authentication.getDetails() instanceof Map<?, ?> details) {
            return (String) details.get("email");
        }

        throw new IllegalStateException("Unable to extract email from authentication");
    }
}
