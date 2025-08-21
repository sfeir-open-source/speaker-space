package com.speakerspace.mapper;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.model.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Component
public class EventMapper {

    private static final Logger logger = LoggerFactory.getLogger(EventMapper.class);
    private static final String BASE_URL = "https://speaker-space.io/event/";

    public EventDTO convertToDTO(Event event) {
        if (event == null) return null;

        return EventDTO.builder()
                .idEvent(event.getIdEvent())
                .eventName(event.getEventName())
                .description(event.getDescription())
                .startDate(Optional.ofNullable(event.getStartDate())
                        .map(timestamp -> timestamp.toDate().toInstant().toString())
                        .orElse(null))
                .endDate(Optional.ofNullable(event.getEndDate())
                        .map(timestamp -> timestamp.toDate().toInstant().toString())
                        .orElse(null))
                .isOnline(Optional.ofNullable(event.getIsOnline()).orElse(false))
                .location(event.getLocation())
                .isPrivate(event.isPrivate())
                .webLinkUrl(event.getWebLinkUrl())
                .isFinish(event.isFinish())
                .url(event.getUrl())
                .userCreateId(event.getUserCreateId())
                .conferenceHallUrl(event.getConferenceHallUrl())
                .teamId(event.getTeamId())
                .timeZone(event.getTimeZone())
                .logoBase64(event.getLogoBase64())
                .type(event.getType())
                .build();
    }

    public Event convertToEntity(EventDTO eventDTO) {
        if (eventDTO == null) return null;

        Event event = new Event();
        event.setIdEvent(eventDTO.idEvent());
        event.setEventName(eventDTO.eventName());
        event.setDescription(eventDTO.description());

        Optional.ofNullable(eventDTO.startDate())
                .filter(date -> !date.trim().isEmpty())
                .ifPresent(date -> event.setStartDate(parseStringToTimestamp(date)));

        Optional.ofNullable(eventDTO.endDate())
                .filter(date -> !date.trim().isEmpty())
                .ifPresent(date -> event.setEndDate(parseStringToTimestamp(date)));

        event.setIsOnline(Optional.ofNullable(eventDTO.isOnline()).orElse(false));
        event.setLocation(eventDTO.location());
        event.setPrivate(Optional.ofNullable(eventDTO.isPrivate()).orElse(true));
        event.setWebLinkUrl(eventDTO.webLinkUrl());
        event.setFinish(Optional.ofNullable(eventDTO.isFinish()).orElse(false));
        event.setUrl(eventDTO.url());
        event.setUserCreateId(eventDTO.userCreateId());
        event.setConferenceHallUrl(eventDTO.conferenceHallUrl());
        event.setTeamId(eventDTO.teamId());
        event.setTimeZone(eventDTO.timeZone());
        event.setLogoBase64(eventDTO.logoBase64());
        event.setType(eventDTO.type());

        return event;
    }

    public EventDTO createForCreation(EventDTO eventDTO, String currentUserId) {
        if (eventDTO == null) {
            throw new IllegalArgumentException("EventDTO cannot be null");
        }

        validateRequiredFields(eventDTO);

        return EventDTO.builder()
                .idEvent(eventDTO.idEvent())
                .eventName(sanitizeEventName(eventDTO.eventName()))
                .description(eventDTO.description())
                .endDate(eventDTO.endDate())
                .url(generateEventUrl(eventDTO.eventName()))
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
                .type(sanitizeEventType(eventDTO.type()))
                .build();
    }

    public EventDTO createForUpdate(EventDTO updateData, EventDTO existingEvent) {
        if (updateData == null || existingEvent == null) {
            throw new IllegalArgumentException("UpdateData and existingEvent cannot be null");
        }

        return EventDTO.builder()
                .idEvent(updateData.idEvent())
                .eventName(updateData.eventName())
                .description(updateData.description())
                .endDate(updateData.endDate())
                .url(updateData.url())
                .startDate(updateData.startDate())
                .isOnline(updateData.isOnline())
                .location(updateData.location())
                .isPrivate(updateData.isPrivate())
                .webLinkUrl(updateData.webLinkUrl())
                .isFinish(updateData.isFinish())
                .userCreateId(existingEvent.userCreateId())
                .conferenceHallUrl(updateData.conferenceHallUrl())
                .teamId(updateData.teamId())
                .timeZone(updateData.timeZone())
                .logoBase64(updateData.logoBase64())
                .type(updateData.type())
                .build();
    }

    public EventDTO updateWithCalculatedDates(EventDTO existingEvent, String newStartDate, String newEndDate) {
        if (existingEvent == null) {
            throw new IllegalArgumentException("ExistingEvent cannot be null");
        }

        return EventDTO.builder()
                .idEvent(existingEvent.idEvent())
                .eventName(existingEvent.eventName())
                .description(existingEvent.description())
                .startDate(newStartDate)
                .endDate(newEndDate)
                .isOnline(existingEvent.isOnline())
                .location(existingEvent.location())
                .isPrivate(existingEvent.isPrivate())
                .webLinkUrl(existingEvent.webLinkUrl())
                .isFinish(existingEvent.isFinish())
                .url(existingEvent.url())
                .userCreateId(existingEvent.userCreateId())
                .conferenceHallUrl(existingEvent.conferenceHallUrl())
                .teamId(existingEvent.teamId())
                .timeZone(existingEvent.timeZone())
                .logoBase64(existingEvent.logoBase64())
                .type(existingEvent.type())
                .build();
    }

    private void validateRequiredFields(EventDTO eventDTO) {
        if (isNullOrEmpty(eventDTO.eventName())) {
            throw new IllegalArgumentException("Event name is required");
        }
        if (isNullOrEmpty(eventDTO.type())) {
            throw new IllegalArgumentException("Event type is required");
        }
    }

    private String sanitizeEventName(String eventName) {
        return eventName != null ? eventName.trim() : null;
    }

    private String sanitizeEventType(String eventType) {
        return eventType != null ? eventType.trim() : null;
    }

    private String generateEventUrl(String eventName) {
        if (isNullOrEmpty(eventName)) {
            return BASE_URL + UUID.randomUUID().toString();
        }

        String urlSuffix = eventName.trim()
                .toLowerCase()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        return urlSuffix.isEmpty() ?
                BASE_URL + UUID.randomUUID().toString() :
                BASE_URL + urlSuffix;
    }

    private boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    private com.google.cloud.Timestamp parseStringToTimestamp(String dateString) {
        try {
            Instant instant = Instant.parse(dateString);
            return com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                    instant.getEpochSecond(), instant.getNano());
        } catch (Exception e) {
            logger.error("Failed to parse date: {}", dateString, e);
            throw new IllegalArgumentException("Invalid date format: " + dateString, e);
        }
    }
}
