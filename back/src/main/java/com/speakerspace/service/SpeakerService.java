package com.speakerspace.service;

import com.speakerspace.model.session.Speaker;
import com.speakerspace.repository.SpeakerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SpeakerService {

    private final SpeakerRepository speakerRepository;

    public SpeakerService(SpeakerRepository speakerRepository) {
        this.speakerRepository = speakerRepository;
    }

    public Speaker saveSpeaker(Speaker speaker) {
        return speakerRepository.save(speaker);
    }

    public Speaker findById(String id) {
        return speakerRepository.findById(id);
    }

    public List<Speaker> findByIds(List<String> ids) {
        return speakerRepository.findByIds(ids);
    }

    public List<Speaker> findByEventId(String eventId) {
        return speakerRepository.findByEventId(eventId);
    }

    public String saveOrUpdateSpeaker(Speaker speaker, String eventId) {
        speaker.setEventId(eventId);

        if (speaker.getId() != null && speakerRepository.existsById(speaker.getId())) {
            Speaker existingSpeaker = speakerRepository.findById(speaker.getId());
            Speaker mergedSpeaker = mergeSpeakerData(existingSpeaker, speaker);
            return speakerRepository.save(mergedSpeaker).getId();
        } else {
            return speakerRepository.save(speaker).getId();
        }
    }

    public List<String> processSpeakers(List<Speaker> speakers, String eventId) {
        if (speakers == null || speakers.isEmpty()) {
            return new ArrayList<>();
        }

        return speakers.stream()
                .map(speaker -> saveOrUpdateSpeaker(speaker, eventId))
                .collect(Collectors.toList());
    }

    private Speaker mergeSpeakerData(Speaker existing, Speaker incoming) {
        Speaker merged = new Speaker();
        merged.setId(existing.getId());
        merged.setEventId(existing.getEventId());
        merged.setName(existing.getName() != null ? existing.getName() : incoming.getName());
        merged.setBio(existing.getBio() != null ? existing.getBio() : incoming.getBio());
        merged.setCompany(existing.getCompany() != null ? existing.getCompany() : incoming.getCompany());
        merged.setPicture(existing.getPicture() != null ? existing.getPicture() : incoming.getPicture());
        merged.setLocation(existing.getLocation() != null ? existing.getLocation() : incoming.getLocation());
        merged.setEmail(existing.getEmail() != null ? existing.getEmail() : incoming.getEmail());
        merged.setReferences(existing.getReferences() != null ? existing.getReferences() : incoming.getReferences());

        Set<String> mergedSocialLinks = new HashSet<>();
        if (existing.getSocialLinks() != null) {
            mergedSocialLinks.addAll(existing.getSocialLinks());
        }
        if (incoming.getSocialLinks() != null) {
            mergedSocialLinks.addAll(incoming.getSocialLinks());
        }
        merged.setSocialLinks(new ArrayList<>(mergedSocialLinks));

        return merged;
    }
}

