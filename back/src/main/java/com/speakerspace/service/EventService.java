package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.EventMapper;
import com.speakerspace.model.Event;
import com.speakerspace.repository.EventRepository;
import org.springframework.stereotype.Service;

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

        UserDTO currentUser = userService.getUserByUid(currentUserId);
        Event event = eventMapper.convertToEntity(eventDTO);


        Event savedEvent = eventRepository.save(event);
        return eventMapper.convertToDTO(savedEvent);
    }
}
