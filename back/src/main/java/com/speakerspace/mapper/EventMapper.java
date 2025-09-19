package com.speakerspace.mapper;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.model.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

@Component
public class EventMapper {

    private static final Logger logger = LoggerFactory.getLogger(EventMapper.class);

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
