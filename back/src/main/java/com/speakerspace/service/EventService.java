package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.dto.session.SessionScheduleImportDataDTO;
import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.mapper.EventMapper;
import com.speakerspace.model.Event;
import com.speakerspace.model.Team;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.repository.EventRepository;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.SpeakerRepository;
import com.speakerspace.repository.TeamRepository;
import com.speakerspace.utils.date.EventDateCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.AccessDeniedException;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EventService {

    private static final String BASE_URL = "https://speaker-space.io/event/";

    private final EventMapper eventMapper;
    private final EventRepository eventRepository;
    private final UserService userService;
    private final SessionRepository sessionRepository;
    private final SpeakerRepository speakerRepository;
    private final TeamRepository teamRepository;

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

        Event savedEvent = eventRepository.saveEvent(event);
        return eventMapper.convertToDTO(savedEvent);
    }

    public EventDTO getEventById(String id) {
        Event event = eventRepository.findEventById(id);
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

        Event existingEvent = eventRepository.findEventById(eventDTO.idEvent());
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

        Event updatedEvent = eventRepository.saveEvent(eventToUpdate);
        return eventMapper.convertToDTO(updatedEvent);
    }

    public boolean deleteEvent(String eventId) throws AccessDeniedException {
        String currentUserId = userService.getCurrentUserId();

        Event event = eventRepository.findEventById(eventId);
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

        boolean eventDeleted = eventRepository.deleteEvent(eventId);

        if (eventDeleted) {
            log.info("Event deleted successfully: {} (with {} sessions and {} speakers)",
                    eventId, deletedSessionsCount, deletedSpeakersCount);
            return true;
        } else {
            log.error("Failed to delete event: {}", eventId);
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
        Instant instant = Instant.parse(dateString);
        return com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                instant.getEpochSecond(), instant.getNano());
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

    public void updateEventDatesFromSessions(String eventId, List<SessionScheduleImportDataDTO> sessions) {
        EventDateCalculator.DateRange dateRange = EventDateCalculator.calculateEventDateRange(sessions);

        if (dateRange == null) {
            log.debug("No valid date range found in sessions for event: {}", eventId);
            return;
        }

        EventDTO currentEvent = getEventById(eventId);
        if (currentEvent == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        String newStartDate = dateRange.startDate().toString();
        String newEndDate = dateRange.endDate().toString();

        boolean startDateChanged = !Objects.equals(currentEvent.startDate(), newStartDate);
        boolean endDateChanged = !Objects.equals(currentEvent.endDate(), newEndDate);

        if (startDateChanged || endDateChanged) {
            EventDTO updatedEvent = EventDTO.builder()
                    .idEvent(currentEvent.idEvent())
                    .eventName(currentEvent.eventName())
                    .description(currentEvent.description())
                    .startDate(newStartDate)
                    .endDate(newEndDate)
                    .isOnline(currentEvent.isOnline())
                    .location(currentEvent.location())
                    .isPrivate(currentEvent.isPrivate())
                    .webLinkUrl(currentEvent.webLinkUrl())
                    .isFinish(currentEvent.isFinish())
                    .url(currentEvent.url())
                    .userCreateId(currentEvent.userCreateId())
                    .conferenceHallUrl(currentEvent.conferenceHallUrl())
                    .teamId(currentEvent.teamId())
                    .timeZone(currentEvent.timeZone())
                    .logoBase64(currentEvent.logoBase64())
                    .type(currentEvent.type())
                    .build();

            updateEvent(updatedEvent);

            log.info("Updated event {} dates from sessions: start={}, end={}",
                    eventId, newStartDate, newEndDate);
        } else {
            log.debug("Event {} dates are already up to date", eventId);
        }
    }

    public List<EventDTO> getEventsBySpeakerEmail() {
        try {
            String currentUserId = userService.getCurrentUserId();
            UserDTO currentUser = userService.getUserByUid(currentUserId);

            if (currentUser == null || currentUser.email() == null) {
                log.debug("No current user or email found for speaker events");
                return Collections.emptyList();
            }

            List<Speaker> userSpeakers = speakerRepository.findByEmail(currentUser.email());

            if (userSpeakers.isEmpty()) {
                log.debug("No speaker records found for email: {}", currentUser.email());
                return Collections.emptyList();
            }

            Set<String> eventIds = userSpeakers.stream()
                    .map(Speaker::getEventId)
                    .filter(Objects::nonNull)
                    .filter(id -> !id.trim().isEmpty())
                    .collect(Collectors.toSet());

            if (eventIds.isEmpty()) {
                log.debug("No valid event IDs found in speaker records");
                return Collections.emptyList();
            }

            List<EventDTO> speakerEvents = eventIds.stream()
                    .map(this::getEventById)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            speakerEvents.sort((e1, e2) -> {
                if (e1.startDate() != null && e2.startDate() != null) {
                    return e2.startDate().compareTo(e1.startDate());
                }
                return e2.idEvent().compareTo(e1.idEvent());
            });

            log.debug("Found {} speaker events for user {}", speakerEvents.size(), currentUser.email());
            return speakerEvents;

        } catch (Exception e) {
            log.error("Error retrieving events by speaker email", e);
            return Collections.emptyList();
        }
    }

    public boolean isUserSpeakerOfEvent(String eventId) {
        try {
            String currentUserId = userService.getCurrentUserId();
            UserDTO currentUser = userService.getUserByUid(currentUserId);

            if (currentUser == null || currentUser.email() == null || eventId == null) {
                return false;
            }

            List<Speaker> speakers = speakerRepository.findByEmailAndEventId(
                    currentUser.email(), eventId);

            return !speakers.isEmpty();

        } catch (Exception e) {
            log.error("Error checking if user is speaker of event: {}", eventId, e);
            return false;
        }
    }

    public List<EventDTO> getAllUserRelatedEventsComplete() {
        Set<EventDTO> allEvents = new LinkedHashSet<>();

        try {
            List<EventDTO> createdEvents = getEventsForCurrentUser();
            allEvents.addAll(createdEvents);
            log.debug("Found {} created events", createdEvents.size());

            String currentUserId = userService.getCurrentUserId();
            List<EventDTO> teamEvents = getEventsFromUserTeams(currentUserId);
            allEvents.addAll(teamEvents);
            log.debug("Found {} team events", teamEvents.size());

            List<EventDTO> speakerEvents = getEventsBySpeakerEmail();
            allEvents.addAll(speakerEvents);
            log.debug("Found {} speaker events", speakerEvents.size());

            List<EventDTO> result = new ArrayList<>(allEvents);
            result.sort((e1, e2) -> {
                if (e1.startDate() != null && e2.startDate() != null) {
                    return e2.startDate().compareTo(e1.startDate());
                }
                return e2.idEvent().compareTo(e1.idEvent());
            });
            return result;

        } catch (Exception e) {
            log.error("Error retrieving all user related events", e);
            return Collections.emptyList();
        }
    }

    private List<EventDTO> getEventsFromUserTeams(String userId) {
        try {
            List<Team> userTeams = teamRepository.findTeamsByMemberId(userId);

            if (userTeams.isEmpty()) {
                return Collections.emptyList();
            }

            Set<EventDTO> teamEvents = new HashSet<>();

            for (Team team : userTeams) {
                List<EventDTO> events = getEventsByTeamId(team.getId());
                teamEvents.addAll(events);
            }

            return new ArrayList<>(teamEvents);

        } catch (Exception e) {
            log.error("Error retrieving events from user teams for user: {}", userId, e);
            return Collections.emptyList();
        }
    }

    public Record getEventByIdForCurrentUser(String id) {
        EventDTO event = getEventById(id);
        if (event == null) {
            throw new EntityNotFoundException("Event not found with id: " + id);
        }
        return event;
    }

}
