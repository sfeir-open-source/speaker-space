package com.speakerspace.repository;

import com.speakerspace.model.Event;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository {
    Event saveEvent(Event event);
    Event findEventById(String id);
    Event findByUrl(String url);
    List<Event> findByTeamId(String teamId);
    List<Event> findByUserCreateId(String userId);
    boolean existsByEventNameAndTeamId(String eventName, String teamId);
    boolean existsByEventNameAndTeamIdAndIdEventNot(String eventName, String teamId, String excludeEventId);
    boolean deleteEvent(String id);
    int deleteByTeamId(String teamId);
}
