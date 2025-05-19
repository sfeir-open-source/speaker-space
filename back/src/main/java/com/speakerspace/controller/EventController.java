package com.speakerspace.controller;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.service.EventService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/event")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping("/create")
    public ResponseEntity<EventDTO> createEvent(@RequestBody EventDTO eventDTO) {
        EventDTO createdEvent = eventService.createEvent(eventDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDTO> updateEvent(@PathVariable String id, @RequestBody EventDTO eventDTO) {
        if (!id.equals(eventDTO.getIdEvent())) {
            return ResponseEntity.badRequest().build();
        }

        EventDTO updatedEvent = eventService.updateEvent(eventDTO);
        return ResponseEntity.ok(updatedEvent);
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
}
