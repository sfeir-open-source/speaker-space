package com.speakerspace.repository;

import com.speakerspace.model.session.Session;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface SessionRepository {
    Session save(Session session);
    Session findById(String id);
    List<Session> findByEventId(String eventId);
    List<String> findDistinctTracksByEventId(String eventId);
    Session findByIdAndEventId(String sessionId, String eventId);
    Session updateScheduleFields(String sessionId, Date start, Date end, String track);
    boolean existsByIdAndEventId(String id, String eventId);
    boolean delete(String id);
    int deleteByEventId(String eventId);
}
