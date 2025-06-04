package com.speakerspace.repository;

import com.speakerspace.model.session.Session;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SessionRepository {
    Session save(Session session);
    Session findById(String id);
    List<Session> findByEventId(String eventId);
    void deleteById(String id);
    boolean existsByIdAndEventId(String id, String eventId);
}
