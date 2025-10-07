package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.SessionCreateRequestDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.Speaker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class SessionCreateMapper {

    private final SpeakerMapper speakerMapper;
    private final FormatMapper formatMapper;
    private final CategoryMapper categoryMapper;

    public Session convertCreateRequestToSession(String sessionId, String eventId, SessionCreateRequestDTO createRequest) {
        Session session = new Session();

        session.setId(sessionId);
        session.setTitle(createRequest.title().trim());
        session.setAbstractText(trimOrNull(createRequest.abstractText()));
        session.setReferences(trimOrNull(createRequest.references()));
        session.setLevel(createRequest.level());
        session.setTrack(createRequest.track());
        session.setEventId(eventId);

        session.setDeliberationStatus(createRequest.deliberationStatus() != null ?
                createRequest.deliberationStatus() : "ACCEPTED");
        session.setConfirmationStatus(createRequest.confirmationStatus() != null ?
                createRequest.confirmationStatus() : "CONFIRMED");

        if (createRequest.start() != null) {
            session.setStart(createRequest.start());
        }
        if (createRequest.end() != null) {
            session.setEnd(createRequest.end());
        }

        session.setLanguages(createRequest.languages() != null ? createRequest.languages() : new ArrayList<>());
        session.setTags(new ArrayList<>());

        if (createRequest.formats() != null) {
            session.setFormats(createRequest.formats().stream()
                    .map(formatMapper::convertToEntity)
                    .collect(Collectors.toList()));
        } else {
            session.setFormats(new ArrayList<>());
        }

        if (createRequest.categories() != null) {
            session.setCategories(createRequest.categories().stream()
                    .map(categoryMapper::convertToEntity)
                    .collect(Collectors.toList()));
        } else {
            session.setCategories(new ArrayList<>());
        }

        if (createRequest.speakers() != null && !createRequest.speakers().isEmpty()) {
            List<Speaker> speakers = createRequest.speakers().stream()
                    .map(speakerDTO -> convertSpeakerForCreation(speakerDTO, eventId))
                    .collect(Collectors.toList());
            session.setSpeakers(speakers);
        } else {
            session.setSpeakers(new ArrayList<>());
        }

        return session;
    }

    private Speaker convertSpeakerForCreation(SpeakerDTO speakerDTO, String eventId) {
        Speaker speaker = speakerMapper.convertToEntity(speakerDTO);

        if (speaker.getId() == null) {
            speaker.setId(generateSpeakerId());
        }
        speaker.setEventId(eventId);

        return speaker;
    }

    private String trimOrNull(String value) {
        return value != null && !value.trim().isEmpty() ? value.trim() : null;
    }

    private String generateSpeakerId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
