package com.speakerspace.mapper;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.model.Event;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    public EventDTO convertToDTO(Event event) {
        if(event == null){
            return null;
        }

        EventDTO eventDTO = new EventDTO();
        eventDTO.setIdEvent(event.getId());
        eventDTO.setEventName(event.getEventName());
        eventDTO.setDescription(event.getDescription());
        eventDTO.setStartDate(event.getStartDate());
        eventDTO.setEndDate(event.getEndDate());
        eventDTO.setOnline(event.isOnline());
        eventDTO.setLocation(event.getLocation());
        eventDTO.setPrivate(event.isPrivate());
        eventDTO.setWebLinkUrl(event.getWebLinkUrl());
        eventDTO.setFinish(event.isFinish());
        eventDTO.setUrl(event.getUrl());

        return eventDTO;
    }

    public Event convertToEntity(EventDTO eventDTO) {
        if(eventDTO == null){
            return null;
        }

        Event event = new Event();
        event.setId(eventDTO.getIdEvent());
        event.setEventName(eventDTO.getEventName());
        event.setDescription(eventDTO.getDescription());
        event.setStartDate(eventDTO.getStartDate());
        event.setEndDate(eventDTO.getEndDate());
        event.setOnline(eventDTO.isOnline());
        event.setLocation(eventDTO.getLocation());
        event.setPrivate(eventDTO.isPrivate());
        event.setWebLinkUrl(eventDTO.getWebLinkUrl());
        event.setFinish(eventDTO.isFinish());
        event.setUrl(eventDTO.getUrl());

        return event;
    }
}
