package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.SpeakerCreateRequestDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class SpeakerMapper {

    public SpeakerDTO convertToDTO(Speaker speaker) {
        if(speaker  == null) return null;

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
        if(dto  == null) return null;

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

    public Speaker convertFromCreateRequest(String speakerId, String eventId,
                                            SpeakerCreateRequestDTO request) {
        Speaker speaker = new Speaker();
        speaker.setId(speakerId);
        speaker.setName(request.name().trim());
        speaker.setBio(trimOrNull(request.bio()));
        speaker.setCompany(trimOrNull(request.company()));
        speaker.setReferences(trimOrNull(request.references()));
        speaker.setEmail(request.email().toLowerCase().trim());
        speaker.setEventId(eventId);
        speaker.setPicture(trimOrNull(request.picture()));
        speaker.setLocation(trimOrNull(request.location()));

        List<String> socialLinks = request.socialLinks() != null ?
                request.socialLinks().stream()
                        .filter(link -> link != null && !link.trim().isEmpty())
                        .map(String::trim)
                        .distinct()
                        .collect(Collectors.toList()) :
                new ArrayList<>();
        speaker.setSocialLinks(socialLinks);

        return speaker;
    }

    private String trimOrNull(String value) {
        return value != null && !value.trim().isEmpty() ? value.trim() : null;
    }
}
