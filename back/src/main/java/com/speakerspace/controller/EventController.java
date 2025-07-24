package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.exception.UnauthorizedException;
import com.speakerspace.security.AuthenticationHelper;
import com.speakerspace.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/event")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final AuthenticationHelper authHelper;

    @PostMapping("/create")
    public ResponseEntity<EventDTO> createEvent(@RequestBody EventDTO eventDTO, Authentication authentication) {
        if (authentication == null) {
            throw new UnauthorizedException("Authentication required");
        }

        EventDTO eventWithUserId = EventDTO.builder()
                .idEvent(eventDTO.idEvent())
                .eventName(eventDTO.eventName())
                .description(eventDTO.description())
                .endDate(eventDTO.endDate())
                .url(eventDTO.url())
                .startDate(eventDTO.startDate())
                .isOnline(eventDTO.isOnline())
                .location(eventDTO.location())
                .isPrivate(eventDTO.isPrivate())
                .webLinkUrl(eventDTO.webLinkUrl())
                .isFinish(eventDTO.isFinish())
                .userCreateId(authHelper.getUserId(authentication))
                .conferenceHallUrl(eventDTO.conferenceHallUrl())
                .teamId(eventDTO.teamId())
                .timeZone(eventDTO.timeZone())
                .logoBase64(eventDTO.logoBase64())
                .type(eventDTO.type())
                .build();

        EventDTO createdEvent = eventService.createEvent(eventWithUserId);
        return ResponseEntity.ok(createdEvent);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEvent(@PathVariable String id) {
        EventDTO event = eventService.getEventById(id);
        if (event == null) {
            throw new EntityNotFoundException("Event not found with id: " + id);
        }
        return ResponseEntity.ok(event);
    }

    @GetMapping("/by-url/{urlId}")
    public ResponseEntity<EventDTO> getEventByUrl(@PathVariable String urlId) {
        EventDTO event = eventService.getEventByUrl(urlId);
        if (event == null) {
            throw new EntityNotFoundException("Event not found with URL: " + urlId);
        }
        return ResponseEntity.ok(event);
    }

    @GetMapping("/by-team/{teamId}")
    public ResponseEntity<List<EventDTO>> getEventsByTeam(@PathVariable String teamId) {
        return ResponseEntity.ok(eventService.getEventsByTeamId(teamId));
    }

    @GetMapping("/my-events")
    public ResponseEntity<List<EventDTO>> getMyEvents() {
        return ResponseEntity.ok(eventService.getEventsForCurrentUser());
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(
            @PathVariable String id,
            @RequestBody EventDTO eventDTO,
            Authentication authentication) throws AccessDeniedException {

        if (authentication == null) {
            throw new UnauthorizedException("Authentication required");
        }

        if (!id.equals(eventDTO.idEvent())) {
            throw new IllegalArgumentException("Path ID and body ID must match");
        }

        EventDTO existingEvent = eventService.getEventById(id);
        if (existingEvent == null) {
            throw new EntityNotFoundException("Event not found with id: " + id);
        }

        if (!authHelper.isUserAuthorized(authentication, existingEvent.userCreateId())) {
            throw new AccessDeniedException("User not authorized to update this event");
        }

        EventDTO eventWithPreservedUserId = EventDTO.builder()
                .idEvent(eventDTO.idEvent())
                .eventName(eventDTO.eventName())
                .description(eventDTO.description())
                .endDate(eventDTO.endDate())
                .url(eventDTO.url())
                .startDate(eventDTO.startDate())
                .isOnline(eventDTO.isOnline())
                .location(eventDTO.location())
                .isPrivate(eventDTO.isPrivate())
                .webLinkUrl(eventDTO.webLinkUrl())
                .isFinish(eventDTO.isFinish())
                .userCreateId(existingEvent.userCreateId())
                .conferenceHallUrl(eventDTO.conferenceHallUrl())
                .teamId(eventDTO.teamId())
                .timeZone(eventDTO.timeZone())
                .logoBase64(eventDTO.logoBase64())
                .type(eventDTO.type())
                .build();

        EventDTO updatedEvent = eventService.updateEvent(eventWithPreservedUserId);
        return ResponseEntity.ok(updatedEvent);
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Map<String, Object>> deleteEvent(@PathVariable String eventId) throws AccessDeniedException {
        boolean deleted = eventService.deleteEvent(eventId);

        if (!deleted) {
            throw new EntityNotFoundException("Event not found with id: " + eventId);
        }

        Map<String, Object> response = Map.of(
                "message", "Event and associated speakers and sessions deleted successfully",
                "eventId", eventId
        );
        return ResponseEntity.ok(response);
    }
}
