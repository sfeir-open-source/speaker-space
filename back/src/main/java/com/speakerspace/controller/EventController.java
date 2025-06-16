package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.ImportResultDTO;
import com.speakerspace.dto.session.SessionImportRequestDTO;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.service.EventService;
import com.speakerspace.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/event")
public class EventController {

    private final EventService eventService;
    private static final Logger logger = LoggerFactory.getLogger(EventController.class);
    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @Autowired
    private SessionService sessionService;

    @PostMapping("/create")
    public ResponseEntity<EventDTO> createEvent(@RequestBody EventDTO eventDTO, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String userId = authentication.getName();
        eventDTO.setUserCreateId(userId);

        try {
            EventDTO createdEvent = eventService.createEvent(eventDTO);
            return ResponseEntity.ok(createdEvent);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(
            @PathVariable String id,
            @RequestBody EventDTO eventDTO,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String userId = authentication.getName();

        if (!id.equals(eventDTO.getIdEvent())) {
            return ResponseEntity.badRequest().build();
        }

        try {
            EventDTO existingEvent = eventService.getEventById(id);

            if (existingEvent == null) {
                return ResponseEntity.notFound().build();
            }

            if (!userId.equals(existingEvent.getUserCreateId()) &&
                    !authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            eventDTO.setUserCreateId(existingEvent.getUserCreateId());
            EventDTO updatedEvent = eventService.updateEvent(eventDTO);
            return ResponseEntity.ok(updatedEvent);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating event: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEvent(@PathVariable String id) {
        EventDTO event = eventService.getEventById(id);
        return event != null ? ResponseEntity.ok(event) : ResponseEntity.notFound().build();
    }

    @GetMapping("/by-url/{urlId}")
    public ResponseEntity<EventDTO> getEventByUrl(@PathVariable String urlId) {
        EventDTO event = eventService.getEventByUrl(urlId);
        return event != null ? ResponseEntity.ok(event) : ResponseEntity.notFound().build();
    }

    @GetMapping("/by-team/{teamId}")
    public ResponseEntity<List<EventDTO>> getEventsByTeam(@PathVariable String teamId) {
        List<EventDTO> events = eventService.getEventsByTeamId(teamId);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/my-events")
    public ResponseEntity<List<EventDTO>> getMyEvents() {
        List<EventDTO> events = eventService.getEventsForCurrentUser();
        return ResponseEntity.ok(events);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        boolean deleted = eventService.deleteEvent(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/{eventId}/sessions/import")
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

    @GetMapping("/{eventId}/sessions")
    public ResponseEntity<List<SessionImportData>> getSessionsByEventId(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        HttpSession session = request.getSession(false);

        try {
            String userEmail = (String) request.getAttribute("userEmail");

            if (userEmail == null && authentication != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof String) {
                    userEmail = (String) principal;
                }
            }

            if (userEmail == null && session != null) {
                userEmail = (String) session.getAttribute("userEmail");
            }

            if (userEmail == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            List<SessionImportData> sessions = sessionService.getSessionsAsImportData(eventId);

            return ResponseEntity.ok(sessions);

        } catch (Exception e) {
            logger.error("Error retrieving sessions for event {}: {}", eventId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{eventId}/sessions/{sessionId}")
    public ResponseEntity<SessionImportData> getSessionById(
            @PathVariable String eventId,
            @PathVariable String sessionId,
            HttpServletRequest request,
            Authentication authentication) {

        HttpSession session = request.getSession(false);

        try {
            String userEmail = (String) request.getAttribute("userEmail");

            if (userEmail == null && authentication != null) {
                Object principal = authentication.getPrincipal();
                if (principal instanceof String) {
                    userEmail = (String) principal;
                }
            }

            if (userEmail == null && session != null) {
                userEmail = (String) session.getAttribute("userEmail");
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
}
