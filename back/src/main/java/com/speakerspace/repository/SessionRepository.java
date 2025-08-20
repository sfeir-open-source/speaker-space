package com.speakerspace.repository;

import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface SessionRepository {
    void saveSession(Session session);
    Optional<Session> findSessionById(String id);
    List<Session> findByEventId(String eventId);
    List<String> findDistinctTracksByEventId(String eventId);
    Session findByIdAndEventId(String sessionId, String eventId);
    Session updateScheduleFields(String sessionId, Date start, Date end, String track);
    boolean existsByIdAndEventId(String id, String eventId);
    boolean deleteSession(String id);
    int deleteByEventId(String eventId);
    List<Session> findByEventIdAndSpeakerEmail(String eventId, String speakerEmail);
    List<Speaker> findUniqueSpeekersByEventId(String eventId);
    List<Session> findAll();
    Set<String> findAllExistingConferenceHallIds();
    Session findByIdConferenceHall(String idConferenceHall);
}
