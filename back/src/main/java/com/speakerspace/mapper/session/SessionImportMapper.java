package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.SessionDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Speaker;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class SessionImportMapper {

    public SessionDTO convertImportDataToSessionDTO(SessionDTO importData, String eventId, String appId) {
        return SessionDTO.builder()
                .id(appId)
                .title(importData.title())
                .abstractText(importData.abstractText())
                .deliberationStatus(importData.deliberationStatus())
                .confirmationStatus(importData.confirmationStatus())
                .level(importData.level())
                .references(importData.references())
                .eventId(eventId)
                .start(importData.start())
                .end(importData.end())
                .track(importData.track())
                .formats(defaultIfNull(importData.formats(), new ArrayList<>()))
                .categories(defaultIfNull(importData.categories(), new ArrayList<>()))
                .tags(defaultIfNull(importData.tags(), new ArrayList<>()))
                .languages(defaultIfNull(importData.languages(), new ArrayList<>()))
                .speakers(defaultIfNull(importData.speakers(), new ArrayList<>()))
                .reviews(importData.reviews())
                .build();
    }

    public List<Speaker> processSpeakersForImport(List<SpeakerDTO> speakerDTOs, String eventId, String conferenceHallSessionId) {
        if (speakerDTOs == null || speakerDTOs.isEmpty()) {
            return new ArrayList<>();
        }

        return speakerDTOs.stream()
                .map(speakerDTO -> convertSpeakerDTOForImport(speakerDTO, eventId))
                .collect(Collectors.toList());
    }

    private Speaker convertSpeakerDTOForImport(SpeakerDTO speakerDTO, String eventId) {
        Speaker speaker = new Speaker();
        speaker.setId(generateSpeakerId());
        speaker.setIdConferenceHall(speakerDTO.id());
        speaker.setName(speakerDTO.name());
        speaker.setBio(speakerDTO.bio());
        speaker.setCompany(speakerDTO.company());
        speaker.setReferences(speakerDTO.references());
        speaker.setPicture(speakerDTO.picture());
        speaker.setLocation(speakerDTO.location());
        speaker.setEmail(speakerDTO.email());
        speaker.setSocialLinks(speakerDTO.socialLinks() != null ?
                speakerDTO.socialLinks() : new ArrayList<>());
        speaker.setEventId(eventId);
        return speaker;
    }

    private String generateSpeakerId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private <T> T defaultIfNull(T value, T defaultValue) {
        return value != null ? value : defaultValue;
    }
}
