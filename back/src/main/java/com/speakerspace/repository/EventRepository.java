package com.speakerspace.repository;

import com.speakerspace.model.Event;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository {
    Event save(Event event);
}
