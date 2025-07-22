package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.mapper.EventMapper;
import com.speakerspace.model.Event;
import com.speakerspace.repository.EventRepository;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.SpeakerRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventService {

    private static final String BASE_URL = "https://speaker-space.io/event/";
    private static final Logger logger = LoggerFactory.getLogger(EventService.class);

    private final EventMapper eventMapper;
    private final EventRepository eventRepository;
    private final UserService userService;
    private final SessionRepository sessionRepository;
    private final SpeakerRepository speakerRepository;

    public EventDTO createEvent(EventDTO eventDTO) {
        String currentUserId = userService.getCurrentUserId();

        if (eventDTO.eventName() == null || eventDTO.eventName().trim().isEmpty()) {
            throw new IllegalArgumentException("Event name is required");
        }

        if (eventDTO.type() == null || eventDTO.type().trim().isEmpty()) {
            throw new IllegalArgumentException("Event type is required");
        }

        EventDTO sanitizedEventDTO = EventDTO.builder()
                .idEvent(eventDTO.idEvent())
                .eventName(eventDTO.eventName().trim())
                .description(eventDTO.description())
                .endDate(eventDTO.endDate())
                .url(eventDTO.url())
                .startDate(eventDTO.startDate())
                .isOnline(Optional.ofNullable(eventDTO.isOnline()).orElse(false))
                .location(eventDTO.location())
                .isPrivate(Optional.ofNullable(eventDTO.isPrivate()).orElse(true))
                .webLinkUrl(eventDTO.webLinkUrl())
                .isFinish(Optional.ofNullable(eventDTO.isFinish()).orElse(false))
                .userCreateId(currentUserId)
                .conferenceHallUrl(eventDTO.conferenceHallUrl())
                .teamId(eventDTO.teamId())
                .timeZone(Optional.ofNullable(eventDTO.timeZone()).orElse("Europe/Paris"))
                .logoBase64(eventDTO.logoBase64())
                .type(eventDTO.type().trim())
                .build();

        Event event = eventMapper.convertToEntity(sanitizedEventDTO);

        if (event.getTeamId() != null &&
                eventRepository.existsByEventNameAndTeamId(event.getEventName(), event.getTeamId())) {
            throw new IllegalArgumentException("An event with this name already exists in this team");
        }

        if (event.getUrl() == null || event.getUrl().isEmpty()) {
            String urlSuffix = generateUrlSuffix(event.getEventName());
            event.setUrl(BASE_URL + urlSuffix);
        }

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
                .toList();
    }

    public List<EventDTO> getEventsForCurrentUser() {
        String currentUserId = userService.getCurrentUserId();
        List<Event> events = eventRepository.findByUserCreateId(currentUserId);
        return events.stream()
                .map(eventMapper::convertToDTO)
                .toList();
    }

    public EventDTO updateEvent(EventDTO eventDTO) {
        if (eventDTO.idEvent() == null || eventDTO.idEvent().isEmpty()) {
            throw new IllegalArgumentException("Event ID is required for update");
        }

        Event existingEvent = eventRepository.findById(eventDTO.idEvent());
        if (existingEvent == null) {
            throw new RuntimeException("Event not found");
        }

        if (eventDTO.eventName() != null &&
                !eventDTO.eventName().equals(existingEvent.getEventName()) &&
                existingEvent.getTeamId() != null &&
                eventRepository.existsByEventNameAndTeamIdAndIdEventNot(
                        eventDTO.eventName(),
                        existingEvent.getTeamId(),
                        eventDTO.idEvent()
                )) {
            throw new IllegalArgumentException("An event with this name already exists in this team");
        }

        Event eventToUpdate = mergeEventDataCorrectly(existingEvent, eventDTO);
        updateFinishStatus(eventToUpdate);
        validateEventDates(eventToUpdate);

        Event updatedEvent = eventRepository.save(eventToUpdate);
        return eventMapper.convertToDTO(updatedEvent);
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

    private Event mergeEventDataCorrectly(Event existing, EventDTO updates) {
        if (updates.eventName() != null) {
            existing.setEventName(updates.eventName());
            String newUrl = generateFullUrl(updates.eventName());
            existing.setUrl(newUrl);
        }

        Optional.ofNullable(updates.description()).ifPresent(existing::setDescription);
        Optional.ofNullable(updates.location()).ifPresent(existing::setLocation);
        Optional.ofNullable(updates.webLinkUrl()).ifPresent(existing::setWebLinkUrl);
        Optional.ofNullable(updates.conferenceHallUrl()).ifPresent(existing::setConferenceHallUrl);
        Optional.ofNullable(updates.isOnline()).ifPresent(existing::setIsOnline);
        Optional.ofNullable(updates.isPrivate()).ifPresent(existing::setPrivate);
        Optional.ofNullable(updates.timeZone()).ifPresent(existing::setTimeZone);
        Optional.ofNullable(updates.type()).ifPresent(existing::setType);

        Optional.ofNullable(updates.startDate())
                .filter(date -> !date.trim().isEmpty())
                .ifPresent(date -> existing.setStartDate(parseStringToTimestamp(date)));

        Optional.ofNullable(updates.endDate())
                .filter(date -> !date.trim().isEmpty())
                .ifPresent(date -> existing.setEndDate(parseStringToTimestamp(date)));

        if (updates.logoBase64() != null) {
            existing.setLogoBase64(updates.logoBase64().isEmpty() ? null : updates.logoBase64());
        }

        return existing;
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
            event.setFinish(endInstant.isBefore(Instant.now()));
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
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
