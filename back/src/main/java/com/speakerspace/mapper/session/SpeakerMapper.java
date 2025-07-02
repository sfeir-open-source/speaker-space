package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Speaker;
import org.springframework.stereotype.Component;

@Component
public class SpeakerMapper {

    public SpeakerDTO convertToDTO(Speaker speaker) {

        if(speaker == null) {
            return null;
        }

        SpeakerDTO dto = new SpeakerDTO();
        dto.setId(speaker.getId());
        dto.setName(speaker.getName());
        dto.setBio(speaker.getBio());
        dto.setCompany(speaker.getCompany());
        dto.setReferences(speaker.getReferences());
        dto.setPicture(speaker.getPicture());
        dto.setLocation(speaker.getLocation());
        dto.setEmail(speaker.getEmail());
        dto.setSocialLinks(speaker.getSocialLinks());
        return dto;
    }

    public Speaker convertToEntity(SpeakerDTO dto) {

        if(dto == null) {
            return null;
        }

        Speaker speaker = new Speaker();
        speaker.setId(dto.getId());
        speaker.setName(dto.getName());
        speaker.setBio(dto.getBio());
        speaker.setCompany(dto.getCompany());
        speaker.setReferences(dto.getReferences());
        speaker.setPicture(dto.getPicture());
        speaker.setLocation(dto.getLocation());
        speaker.setEmail(dto.getEmail());
        speaker.setSocialLinks(dto.getSocialLinks());
        return speaker;
    }
}
