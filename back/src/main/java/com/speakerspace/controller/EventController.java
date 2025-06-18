package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.security.AuthenticationHelper;
import com.speakerspace.service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/event")
public class EventController {

    private final EventService eventService;
    private final AuthenticationHelper authHelper;

    public EventController(EventService eventService, AuthenticationHelper authHelper) {
        this.eventService = eventService;
        this.authHelper = authHelper;
    }

    @PostMapping("/create")
    public ResponseEntity<EventDTO> createEvent(@RequestBody EventDTO eventDTO, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        eventDTO.setUserCreateId(authHelper.getUserId(authentication));

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

        if (authentication == null || !id.equals(eventDTO.getIdEvent())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            EventDTO existingEvent = eventService.getEventById(id);
            if (existingEvent == null) {
                return ResponseEntity.notFound().build();
            }

            if (!authHelper.isUserAuthorized(authentication, existingEvent.getUserCreateId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            eventDTO.setUserCreateId(existingEvent.getUserCreateId());
            EventDTO updatedEvent = eventService.updateEvent(eventDTO);
            return ResponseEntity.ok(updatedEvent);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
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
        return ResponseEntity.ok(eventService.getEventsByTeamId(teamId));
    }

    @GetMapping("/my-events")
    public ResponseEntity<List<EventDTO>> getMyEvents() {
        return ResponseEntity.ok(eventService.getEventsForCurrentUser());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        boolean deleted = eventService.deleteEvent(id);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
