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

        SpeakerDTO speakerDTO = new SpeakerDTO();
        speakerDTO.setName(speaker.getName());
        speakerDTO.setBio(speaker.getBio());
        speakerDTO.setCompany(speaker.getCompany());
        speakerDTO.setReferences(speaker.getReferences());
        speakerDTO.setPicture(speaker.getPicture());
        speakerDTO.setLocation(speaker.getLocation());
        speakerDTO.setEmail(speaker.getEmail());
        speakerDTO.setSocialLinks(speaker.getSocialLinks());
        return speakerDTO;
    }

    public Speaker convertToEntity(SpeakerDTO speakerDTO) {
        if(speakerDTO == null) {
            return null;
        }

        Speaker speaker = new Speaker();
        speaker.setName(speakerDTO.getName());
        speaker.setBio(speakerDTO.getBio());
        speaker.setCompany(speakerDTO.getCompany());
        speaker.setReferences(speakerDTO.getReferences());
        speaker.setPicture(speakerDTO.getPicture());
        speaker.setLocation(speakerDTO.getLocation());
        speaker.setEmail(speakerDTO.getEmail());
        speaker.setSocialLinks(speakerDTO.getSocialLinks());
        return speaker;
    }
}
