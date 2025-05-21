package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.mapper.EventMapper;
import com.speakerspace.model.Event;
import com.speakerspace.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventService {

    private static final Logger logger = LoggerFactory.getLogger(EventService.class);

    private static final String BASE_URL = "https://speaker-space.io/event/";

    private final EventMapper eventMapper;
    private final EventRepository eventRepository;
    private final UserService userService;

    public EventService(EventMapper eventMapper, EventRepository eventRepository, UserService userService) {
        this.eventMapper = eventMapper;
        this.eventRepository = eventRepository;
        this.userService = userService;
    }

    public EventDTO createEvent(EventDTO eventDTO) {
        String currentUserId = userService.getCurrentUserId();
        Event event = eventMapper.convertToEntity(eventDTO);

        if (event.getUrl() == null || event.getUrl().isEmpty()) {
            String urlSuffix = generateUrlSuffix(event.getEventName());
            event.setUrl(BASE_URL + urlSuffix);
        }

        event.setUserCreateId(currentUserId);

        Event savedEvent = eventRepository.save(event);
        return eventMapper.convertToDTO(savedEvent);
    }

    public EventDTO getEventById(String id) {
        Event event = eventRepository.findById(id);
        return event != null ? eventMapper.convertToDTO(event) : null;
    }

    public EventDTO getEventByUrl(String urlId) {
        String url = BASE_URL + urlId;
        Event event = eventRepository.findByUrl(url);
        return event != null ? eventMapper.convertToDTO(event) : null;
    }

    public List<EventDTO> getEventsByTeamId(String teamId) {
        List<Event> events = eventRepository.findByTeamId(teamId);
        return events.stream()
                .map(eventMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<EventDTO> getEventsForCurrentUser() {
        String currentUserId = userService.getCurrentUserId();
        List<Event> events = eventRepository.findByUserCreateId(currentUserId);
        return events.stream()
                .map(eventMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    public EventDTO updateEvent(EventDTO eventDTO) {
        Event existingEvent = eventRepository.findById(eventDTO.getIdEvent());

        if (existingEvent == null) {
            throw new RuntimeException("Event not found");
        }

        Event eventToUpdate = eventMapper.convertToEntity(eventDTO);

        eventToUpdate.setUserCreateId(existingEvent.getUserCreateId());

        Event updatedEvent = eventRepository.save(eventToUpdate);

        return eventMapper.convertToDTO(updatedEvent);
    }

    public boolean deleteEvent(String id) {
        String currentUserId = userService.getCurrentUserId();

        Event existingEvent = eventRepository.findById(id);
        if (existingEvent == null) {
            return false;
        }

        if (!existingEvent.getUserCreateId().equals(currentUserId)) {
            throw new RuntimeException("Not authorized to delete this event");
        }

        return eventRepository.delete(id);
    }

    private String generateUrlSuffix(String eventName) {
        if (eventName == null || eventName.isEmpty()) {
            return UUID.randomUUID().toString();
        }

        return eventName.trim()
                .toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-");
    }
}
