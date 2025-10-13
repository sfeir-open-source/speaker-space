package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.SpeakerCreateRequestDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class SpeakerMapper {

    public SpeakerDTO convertToDTO(Speaker speaker) {
        if(speaker == null) return null;

        return new SpeakerDTO(
                speaker.getId(),
                speaker.getName(),
                speaker.getBio(),
                speaker.getCompany(),
                speaker.getReferences(),
                speaker.getPicture(),
                speaker.getLocation(),
                speaker.getEmail(),
                speaker.getSocialLinks()
        );
    }

    public Speaker convertToEntity(SpeakerDTO dto) {
        if(dto == null) return null;

        Speaker speaker = new Speaker();
        speaker.setId(dto.id());
        speaker.setName(dto.name());
        speaker.setBio(dto.bio());
        speaker.setCompany(dto.company());
        speaker.setReferences(dto.references());
        speaker.setPicture(dto.picture());
        speaker.setLocation(dto.location());
        speaker.setEmail(dto.email());
        speaker.setSocialLinks(dto.socialLinks());
        return speaker;
    }

    public Speaker buildSpeakerFromRequest(String eventId, SpeakerCreateRequestDTO createRequest) {
        String speakerId = generateSpeakerId();

        Speaker speaker = new Speaker();
        speaker.setId(speakerId);
        speaker.setName(createRequest.name().trim());
        speaker.setBio(trimOrNull(createRequest.bio()));
        speaker.setCompany(trimOrNull(createRequest.company()));
        speaker.setReferences(trimOrNull(createRequest.references()));
        speaker.setEmail(createRequest.email().toLowerCase().trim());
        speaker.setEventId(eventId);
        speaker.setPicture(trimOrNull(createRequest.picture()));
        speaker.setLocation(trimOrNull(createRequest.location()));

        List<String> socialLinks = createRequest.socialLinks() != null ?
                createRequest.socialLinks().stream()
                        .filter(link -> link != null && !link.trim().isEmpty())
                        .map(String::trim)
                        .distinct()
                        .collect(Collectors.toList()) :
                new ArrayList<>();
        speaker.setSocialLinks(socialLinks);

        return speaker;
    }

    private String generateSpeakerId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private String trimOrNull(String value) {
        return value != null && !value.trim().isEmpty() ? value.trim() : null;
    }
}
