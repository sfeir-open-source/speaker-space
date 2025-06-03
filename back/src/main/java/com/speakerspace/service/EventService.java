package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.mapper.EventMapper;
import com.speakerspace.model.Event;
import com.speakerspace.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventService {

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

        if (eventDTO.getIsPrivate() == null) {
            eventDTO.setPrivate(true);
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

        Event eventToUpdate = mergeEventDataCorrectly(existingEvent, eventDTO);
        updateFinishStatus(eventToUpdate);
        validateEventDates(eventToUpdate);

        Event updatedEvent = eventRepository.save(eventToUpdate);
        return eventMapper.convertToDTO(updatedEvent);
    }

    private Event mergeEventDataCorrectly(Event existing, EventDTO updates) {
        Event merged = existing;
        if (updates.getEventName() != null) {
            merged.setEventName(updates.getEventName());
            String newUrl = generateFullUrl(updates.getEventName());
            merged.setUrl(newUrl);
        }

        if (updates.getDescription() != null) {
            merged.setDescription(updates.getDescription());
        }

        if (updates.getLocation() != null) {
            merged.setLocation(updates.getLocation());
        }

        if (updates.getWebLinkUrl() != null) {
            merged.setWebLinkUrl(updates.getWebLinkUrl());
        }

        if (updates.getConferenceHallUrl() != null) {
            merged.setConferenceHallUrl(updates.getConferenceHallUrl());
        }

        if (updates.getIsOnline() != null) {
            merged.setIsOnline(updates.getIsOnline());
        }

        if (updates.getIsPrivate() != null) {
            merged.setPrivate(updates.getIsPrivate());
        }

        if (updates.getStartDate() != null && !updates.getStartDate().isEmpty()) {
            merged.setStartDate(parseStringToTimestamp(updates.getStartDate()));
        }

        if (updates.getEndDate() != null && !updates.getEndDate().isEmpty()) {
            merged.setEndDate(parseStringToTimestamp(updates.getEndDate()));
        }

        if (updates.getTimeZone() != null) {
            merged.setTimeZone(updates.getTimeZone());
        }

        if (updates.isFinish() != null) {
            merged.setFinish(updates.isFinish());
        }

        if (updates.getLogoBase64() != null) {
            if (updates.getLogoBase64().isEmpty()) {
                merged.setLogoBase64(null);
            } else {
                merged.setLogoBase64(updates.getLogoBase64());
            }
        }

        if (updates.getType() != null) {
            merged.setType(updates.getType());
        }

        return merged;
    }

    private String generateFullUrl(String eventName) {
        String urlSuffix = eventName.trim()
                .toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-");

        return "http://localhost:4200/event/" + urlSuffix;
    }

    private void updateFinishStatus(Event event) {
        if (event.getEndDate() != null) {
            Instant endInstant = Instant.ofEpochSecond(
                    event.getEndDate().getSeconds(),
                    event.getEndDate().getNanos()
            );
            Instant now = Instant.now();

            event.setFinish(endInstant.isBefore(now));
        }
    }

    private void validateEventDates(Event event) {
        if (event.getStartDate() != null && event.getEndDate() != null) {
            Instant startInstant = Instant.ofEpochSecond(
                    event.getStartDate().getSeconds(),
                    event.getStartDate().getNanos()
            );
            Instant endInstant = Instant.ofEpochSecond(
                    event.getEndDate().getSeconds(),
                    event.getEndDate().getNanos()
            );

            if (endInstant.isBefore(startInstant)) {
                throw new IllegalArgumentException("End date must be after start date");
            }
        }
    }

    private com.google.cloud.Timestamp parseStringToTimestamp(String dateString) {
        try {
            Instant instant = Instant.parse(dateString);
            return com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                    instant.getEpochSecond(), instant.getNano());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format: " + dateString, e);
        }
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
