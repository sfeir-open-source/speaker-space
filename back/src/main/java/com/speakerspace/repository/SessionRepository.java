package com.speakerspace.repository;

import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface SessionRepository {
    void saveSession(Session session);
    Session findSessionById(String id);
    List<Session> findByEventId(String eventId);
    List<String> findDistinctTracksByEventId(String eventId);
    Session findByIdAndEventId(String sessionId, String eventId);
    Session updateScheduleFields(String sessionId, Date start, Date end, String track);
    boolean existsByIdAndEventId(String id, String eventId);
    boolean deleteSession(String id);
    int deleteByEventId(String eventId);
    Session findByIdConferenceHallAndEventId(String idConferenceHall, String eventId);
    List<Session> findByEventIdAndSpeakerEmail(String eventId, String speakerEmail);
    List<Speaker> findUniqueSpeekersByEventId(String eventId);
    List<Session> findAll();
    List<Session> findAll(int limit, String startAfter);
    long countAll();
}
