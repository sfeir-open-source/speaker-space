package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.ImportResultDTO;
import com.speakerspace.dto.session.SessionImportRequestDTO;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.service.EventService;
import com.speakerspace.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/session")
public class SessionController {

    private final EventService eventService;
    private final SessionService sessionService;
    private static final Logger logger = LoggerFactory.getLogger(SessionController.class);

    public SessionController(EventService eventService, SessionService sessionService) {
        this.eventService = eventService;
        this.sessionService = sessionService;
    }

    @PostMapping("/event/{eventId}/import")
    public ResponseEntity<ImportResultDTO> importSessions(
            @PathVariable String eventId,
            @RequestBody SessionImportRequestDTO importRequest,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String userId = authentication.getName();

        try {
            EventDTO existingEvent = eventService.getEventById(eventId);
            if (existingEvent == null) {
                return ResponseEntity.notFound().build();
            }

            boolean isOwner = userId.equals(existingEvent.getUserCreateId());
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            logger.debug("Permission check - isOwner: {}, isAdmin: {}, eventOwner: {}",
                    isOwner, isAdmin, existingEvent.getUserCreateId());

            if (!isOwner && !isAdmin) {
                logger.warn("User {} does not have permission to import sessions for event {}", userId, eventId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (!eventId.equals(importRequest.getEventId())) {
                logger.warn("Event ID mismatch: path={}, body={}", eventId, importRequest.getEventId());
                return ResponseEntity.badRequest().build();
            }

            ImportResultDTO result = sessionService.importSessions(eventId, importRequest.getSessions());
            logger.info("Import completed: {}/{} sessions imported successfully",
                    result.getSuccessCount(), result.getTotalCount());

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            logger.error("Invalid import request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error importing sessions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SessionImportData>> getSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        HttpSession httpSession = request.getSession(false);

        try {
            String userEmail = (String) request.getAttribute("userEmail");

            if (userEmail == null && authentication != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof String) {
                    userEmail = (String) principal;
                }
            }

            if (userEmail == null && httpSession != null) {
                userEmail = (String) httpSession.getAttribute("userEmail");
            }

            if (userEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<SessionImportData> sessions = sessionService.getSessionsAsImportData(eventId);

            sessions.sort((s1, s2) -> {
                String title1 = s1.getTitle() != null ? s1.getTitle().toLowerCase() : "";
                String title2 = s2.getTitle() != null ? s2.getTitle().toLowerCase() : "";
                return title1.compareTo(title2);
            });

            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            logger.error("Error retrieving sessions for event {}: {}", eventId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/session/{sessionId}")
    public ResponseEntity<SessionImportData> getSessionById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            HttpServletRequest request,
            Authentication authentication) {

        HttpSession httpSession = request.getSession(false);

        try {
            String userEmail = (String) request.getAttribute("userEmail");

            if (userEmail == null && authentication != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof String) {
                    userEmail = (String) principal;
                }
            }

            if (userEmail == null && httpSession != null) {
                userEmail = (String) httpSession.getAttribute("userEmail");
            }

            if (userEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            SessionImportData sessionData = sessionService.getSessionById(eventId, sessionId);

            if (sessionData == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(sessionData);

        } catch (Exception e) {
            logger.error("Error retrieving session {} for event {}: {}", sessionId, eventId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/speakers")
    public ResponseEntity<List<Speaker>> getSpeakersByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        HttpSession httpSession = request.getSession(false);

        try {
            String userEmail = (String) request.getAttribute("userEmail");

            if (userEmail == null && authentication != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof String) {
                    userEmail = (String) principal;
                }
            }

            if (userEmail == null && httpSession != null) {
                userEmail = (String) httpSession.getAttribute("userEmail");
            }

            if (userEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<SessionImportData> sessions = sessionService.getSessionsAsImportData(eventId);

            Map<String, Speaker> uniqueSpeakers = new HashMap<>();

            for (SessionImportData session : sessions) {
                if (session.getSpeakers() != null) {
                    for (Speaker speaker : session.getSpeakers()) {
                        if (speaker.getName() != null && !speaker.getName().trim().isEmpty()) {
                            String speakerKey = speaker.getName().toLowerCase().trim();
                            uniqueSpeakers.put(speakerKey, speaker);
                        }
                    }
                }
            }

            List<Speaker> speakers = new ArrayList<>(uniqueSpeakers.values());

            speakers.sort((sp1, sp2) -> {
                String name1 = sp1.getName() != null ? sp1.getName().toLowerCase() : "";
                String name2 = sp2.getName() != null ? sp2.getName().toLowerCase() : "";
                return name1.compareTo(name2);
            });

            return ResponseEntity.ok(speakers);

        } catch (Exception e) {
            logger.error("Error retrieving speakers for event {}: {}", eventId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/event/{eventId}/speaker/{encodedEmail}")
    public ResponseEntity<Speaker> getSpeakerByEmail(
            @PathVariable String eventId,
            @PathVariable String encodedEmail,
            HttpServletRequest request,
            Authentication authentication) {

        HttpSession httpSession = request.getSession(false);

        try {
            String userEmail = (String) request.getAttribute("userEmail");

            if (userEmail == null && authentication != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof String) {
                    userEmail = (String) principal;
                }
            }

            if (userEmail == null && httpSession != null) {
                userEmail = (String) httpSession.getAttribute("userEmail");
            }

            if (userEmail == null) {
                logger.warn("Unauthorized access attempt for speaker with encoded email {} in event {}",
                        encodedEmail, eventId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String decodedEmail;
            try {
                decodedEmail = decodeEmailFromBase64(encodedEmail);
                logger.debug("Decoded email from Base64: {}", decodedEmail);
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid Base64 encoded email: {}", encodedEmail);
                return ResponseEntity.badRequest().build();
            }

            if (!isValidEmail(decodedEmail)) {
                logger.warn("Invalid email format after decoding: {}", decodedEmail);
                return ResponseEntity.badRequest().build();
            }

            List<SessionImportData> sessions = sessionService.getSessionsAsImportData(eventId);

            Optional<Speaker> foundSpeaker = sessions.stream()
                    .filter(session -> session.getSpeakers() != null)
                    .flatMap(session -> session.getSpeakers().stream())
                    .filter(speaker -> speaker.getEmail() != null &&
                            speaker.getEmail().equalsIgnoreCase(decodedEmail))
                    .findFirst();

            if (foundSpeaker.isPresent()) {
                logger.debug("Speaker found successfully: {}", foundSpeaker.get().getName());
                return ResponseEntity.ok(foundSpeaker.get());
            } else {
                logger.warn("Speaker not found with email {} for event {}", decodedEmail, eventId);
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            logger.error("Error retrieving speaker with encoded email {} for event {}: {}",
                    encodedEmail, eventId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String decodeEmailFromBase64(String encodedEmail) {
        if (encodedEmail == null || encodedEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Encoded email cannot be null or empty");
        }

        try {
            byte[] decodedBytes = Base64.getUrlDecoder().decode(encodedEmail);
            return new String(decodedBytes, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Base64 encoding: " + e.getMessage());
        }
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        String emailPattern = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailPattern) && email.length() <= 254;
    }
}