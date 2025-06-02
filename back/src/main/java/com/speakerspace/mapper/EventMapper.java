package com.speakerspace.mapper;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.model.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class EventMapper {

    private static final Logger logger = LoggerFactory.getLogger(EventMapper.class);

    public EventDTO convertToDTO(Event event) {
        if(event == null){
            return null;
        }

        EventDTO eventDTO = new EventDTO();
        eventDTO.setIdEvent(event.getIdEvent());
        eventDTO.setEventName(event.getEventName());
        eventDTO.setDescription(event.getDescription());

        if (event.getStartDate() != null) {
            eventDTO.setStartDate(event.getStartDate().toDate().toInstant().toString());
        }
        if (event.getEndDate() != null) {
            eventDTO.setEndDate(event.getEndDate().toDate().toInstant().toString());
        }

        eventDTO.setIsOnline(event.getIsOnline());
        eventDTO.setLocation(event.getLocation());
        eventDTO.setPrivate(event.isPrivate());
        eventDTO.setWebLinkUrl(event.getWebLinkUrl());
        eventDTO.setFinish(event.isFinish());
        eventDTO.setUrl(event.getUrl());
        eventDTO.setUserCreateId(event.getUserCreateId());
        eventDTO.setConferenceHallUrl(event.getConferenceHallUrl());
        eventDTO.setTeamId(event.getTeamId());
        eventDTO.setTimeZone(event.getTimeZone());
        eventDTO.setLogoBase64(event.getLogoBase64());
        eventDTO.setType(event.getType());

        return eventDTO;
    }

    public Event convertToEntity(EventDTO eventDTO) {
        if(eventDTO == null){
            return null;
        }

        Event event = new Event();
        event.setIdEvent(eventDTO.getIdEvent());
        event.setEventName(eventDTO.getEventName());
        event.setDescription(eventDTO.getDescription());

        if (eventDTO.getStartDate() != null && !eventDTO.getStartDate().isEmpty()) {
            event.setStartDate(parseStringToTimestamp(eventDTO.getStartDate()));
        }

        if (eventDTO.getEndDate() != null && !eventDTO.getEndDate().isEmpty()) {
            event.setEndDate(parseStringToTimestamp(eventDTO.getEndDate()));
        }

        event.setIsOnline(eventDTO.getIsOnline());
        event.setLocation(eventDTO.getLocation());
        Boolean isPrivate = eventDTO.getIsPrivate();
        if (isPrivate == null) {
            isPrivate = true;
        }
        event.setPrivate(isPrivate);
        event.setWebLinkUrl(eventDTO.getWebLinkUrl());
        event.setFinish(eventDTO.isFinish());
        event.setUrl(eventDTO.getUrl());
        event.setUserCreateId(eventDTO.getUserCreateId());
        event.setConferenceHallUrl(eventDTO.getConferenceHallUrl());
        event.setTeamId(eventDTO.getTeamId());
        event.setTimeZone(eventDTO.getTimeZone());
        event.setLogoBase64(eventDTO.getLogoBase64());
        event.setType(eventDTO.getType());

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
