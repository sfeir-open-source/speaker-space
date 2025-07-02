package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.mapper.EventMapper;
import com.speakerspace.model.Event;
import com.speakerspace.repository.EventRepository;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.SpeakerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventService {

    private static final String BASE_URL = "https://speaker-space.io/event/";

    private static final Logger logger = LoggerFactory.getLogger(EventService.class);

    private final EventMapper eventMapper;
    private final EventRepository eventRepository;
    private final UserService userService;
    private final SessionRepository sessionRepository;
    private final SpeakerRepository speakerRepository;

    public EventService(EventMapper eventMapper, EventRepository eventRepository, UserService userService, SessionRepository sessionRepository, SpeakerRepository speakerRepository) {
        this.eventMapper = eventMapper;
        this.eventRepository = eventRepository;
        this.userService = userService;
        this.sessionRepository = sessionRepository;
        this.speakerRepository = speakerRepository;
    }

    public EventDTO createEvent(EventDTO eventDTO) {
        String currentUserId = userService.getCurrentUserId();
        Event event = eventMapper.convertToEntity(eventDTO);

        if (event.getTeamId() != null &&
                eventRepository.existsByEventNameAndTeamId(event.getEventName(), event.getTeamId())) {
            throw new IllegalArgumentException("An event with this name already exists in this team");
        }

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
        if (eventDTO.getIdEvent() == null || eventDTO.getIdEvent().isEmpty()) {
            throw new IllegalArgumentException("Event ID is required for update");
        }

        Event existingEvent = eventRepository.findById(eventDTO.getIdEvent());

        if (existingEvent == null) {
            throw new RuntimeException("Event not found");
        }

        if (eventDTO.getEventName() != null &&
                !eventDTO.getEventName().equals(existingEvent.getEventName()) &&
                existingEvent.getTeamId() != null &&
                eventRepository.existsByEventNameAndTeamIdAndIdEventNot(
                        eventDTO.getEventName(),
                        existingEvent.getTeamId(),
                        eventDTO.getIdEvent()
                )) {
            throw new IllegalArgumentException("An event with this name already exists in this team");
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

    public boolean deleteEvent(String eventId) throws AccessDeniedException {
        String currentUserId = userService.getCurrentUserId();

        Event event = eventRepository.findById(eventId);
        if (event == null) {
            return false;
        }

        if (!event.getUserCreateId().equals(currentUserId)) {
            throw new AccessDeniedException("You don't have permission to delete this event");
        }

        try {
            return deleteEventWithDependencies(eventId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete event and associated data", e);
        }
    }

    private boolean deleteEventWithDependencies(String eventId) {
        int deletedSessionsCount = sessionRepository.deleteByEventId(eventId);
        int deletedSpeakersCount = speakerRepository.deleteByEventId(eventId);

        boolean eventDeleted = eventRepository.delete(eventId);

        if (eventDeleted) {
            logger.info("Event deleted successfully: {} (with {} sessions and {} speakers)",
                    eventId, deletedSessionsCount, deletedSpeakersCount);
            return true;
        } else {
            logger.error("Failed to delete event: {}", eventId);
            return false;
        }
    }
}
