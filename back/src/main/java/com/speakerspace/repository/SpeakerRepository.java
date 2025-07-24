package com.speakerspace.repository;

import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpeakerRepository {
    Speaker saveSpeaker(Speaker speaker);
    Speaker findSpeakerById(String id);
    List<Speaker> findByIds(List<String> ids);
    List<Speaker> findByEventId(String eventId);
    boolean speakerExistsById(String id);
    boolean deleteSpeaker(String id);
    int deleteByEventId(String eventId);
}
