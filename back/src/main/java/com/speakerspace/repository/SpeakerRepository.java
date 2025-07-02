package com.speakerspace.repository;

import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpeakerRepository {
    Speaker save(Speaker speaker);
    Speaker findById(String id);
    List<Speaker> findByIds(List<String> ids);
    List<Speaker> findByEventId(String eventId);
    boolean existsById(String id);
    boolean delete(String id);
    int deleteByEventId(String eventId);
}
