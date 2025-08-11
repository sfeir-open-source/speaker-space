package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Component;

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
}
