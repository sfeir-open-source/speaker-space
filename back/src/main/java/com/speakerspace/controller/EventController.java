package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.SessionImportRequestDTO;
import com.speakerspace.model.session.ImportResult;
import com.speakerspace.service.EventService;
import com.speakerspace.service.SessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<ImportResult> importSessions(
            @PathVariable String eventId,
            @RequestBody SessionImportRequestDTO importRequest,
            Authentication authentication) {

        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String userId = authentication.getName();

        try {
            EventDTO existingEvent = eventService.getEventById(eventId);

            if (existingEvent == null) {
                return ResponseEntity.notFound().build();
            }

            if (!userId.equals(existingEvent.getUserCreateId()) &&
                    !authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            if (!eventId.equals(importRequest.getEventId())) {
                importRequest.setEventId(eventId);
            }

            ImportResult result = sessionService.importSessionsFromJson(
                    eventId, importRequest.getSessions());

            if (result.hasErrors() && result.getSuccessCount() == 0) {
                return ResponseEntity.badRequest().body(result);
            } else if (result.hasErrors()) {
                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).body(result);
            } else {
                return ResponseEntity.ok(result);
            }

        } catch (IllegalArgumentException e) {
            logger.error("Invalid request for session import: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error importing sessions for event {}: {}", eventId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
