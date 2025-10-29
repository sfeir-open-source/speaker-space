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
                .online(Optional.ofNullable(event.getOnline()).orElse(false))
                .location(event.getLocation())
                .privateEvent(event.getPrivateEvent())
                .webLinkUrl(event.getWebLinkUrl())
                .finished(event.getFinished())
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

        event.setOnline(Optional.ofNullable(eventDTO.online()).orElse(false));
        event.setLocation(eventDTO.location());
        event.setPrivateEvent(Optional.ofNullable(eventDTO.privateEvent()).orElse(true));
        event.setWebLinkUrl(eventDTO.webLinkUrl());
        event.setFinished(Optional.ofNullable(eventDTO.finished()).orElse(false));
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
                .online(eventDTO.online())
                .location(eventDTO.location())
                .privateEvent(eventDTO.privateEvent())
                .webLinkUrl(eventDTO.webLinkUrl())
                .finished(eventDTO.finished())
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
                .online(updated.online())
                .location(updated.location())
                .privateEvent(updated.privateEvent())
                .webLinkUrl(updated.webLinkUrl())
                .finished(updated.finished())
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
