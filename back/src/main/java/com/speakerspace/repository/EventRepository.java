package com.speakerspace.repository;

import com.speakerspace.model.Event;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository {
    Event save(Event event);
    Event findById(String id);
    Event findByUrl(String url);
    List<Event> findByTeamId(String teamId);
    List<Event> findByUserCreateId(String userId);
    boolean delete(String id);
}
