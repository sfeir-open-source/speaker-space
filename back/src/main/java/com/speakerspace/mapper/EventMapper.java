package com.speakerspace.mapper;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.exception.UnauthorizedException;
import com.speakerspace.model.Event;
import com.speakerspace.security.AuthenticationHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventMapper {

    private final AuthenticationHelper authHelper;

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

    public EventDTO eventWithUserId(EventDTO eventDTO, Authentication authentication) {
        if (eventDTO == null) return null;
        if (authentication == null) {
            throw new UnauthorizedException("Authentication required");
        }

        return EventDTO.builder()
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
    }

    public EventDTO mergeForUpdate(EventDTO updated, EventDTO existing, Authentication authentication) {
        if (updated == null || existing == null)
            throw new IllegalArgumentException("Updated and existing events must not be null");
        if (authentication == null)
            throw new UnauthorizedException("Authentication required");

        return EventDTO.builder()
                .idEvent(existing.idEvent())
                .eventName(updated.eventName())
                .description(updated.description())
                .endDate(updated.endDate())
                .url(updated.url())
                .startDate(updated.startDate())
                .isOnline(updated.isOnline())
                .location(updated.location())
                .isPrivate(updated.isPrivate())
                .webLinkUrl(updated.webLinkUrl())
                .isFinish(updated.isFinish())
                .userCreateId(existing.userCreateId())
                .conferenceHallUrl(updated.conferenceHallUrl())
                .teamId(updated.teamId())
                .timeZone(updated.timeZone())
                .logoBase64(updated.logoBase64())
                .type(updated.type())
                .build();
    }


    private com.google.cloud.Timestamp parseStringToTimestamp(String dateString) {
        try {
            Instant instant = Instant.parse(dateString);
            return com.google.cloud.Timestamp.ofTimeSecondsAndNanos(
                    instant.getEpochSecond(), instant.getNano());
        } catch (Exception e) {
            log.error("Failed to parse date: {}", dateString, e);
            throw new IllegalArgumentException("Invalid date format: " + dateString, e);
        }
    }
}
