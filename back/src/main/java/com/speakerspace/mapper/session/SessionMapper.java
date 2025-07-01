package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.CategoryDTO;
import com.speakerspace.dto.session.FormatDTO;
import com.speakerspace.dto.session.SessionDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.*;
import com.speakerspace.service.SpeakerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Component
public class SessionMapper {

    @Autowired
    private FormatMapper formatMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private ReviewsMapper reviewsMapper;

    @Autowired
    private SpeakerService speakerService;

    public SessionDTO convertToDTO(Session session) {
        if(session == null) {
            return null;
        }

        SessionDTO sessionDTO = new SessionDTO();
        sessionDTO.setId(session.getId());
        sessionDTO.setTitle(session.getTitle());
        sessionDTO.setAbstractText(session.getAbstractText());
        sessionDTO.setDeliberationStatus(session.getDeliberationStatus());
        sessionDTO.setConfirmationStatus(session.getConfirmationStatus());
        sessionDTO.setLevel(session.getLevel());
        sessionDTO.setReferences(session.getReferences());
        sessionDTO.setFormats(convertFormatsToDTO(session.getFormats()));
        sessionDTO.setCategories(convertCategoriesToDTO(session.getCategories()));
        sessionDTO.setTags(session.getTags());
        sessionDTO.setLanguages(session.getLanguages());
        sessionDTO.setSpeakers(convertSpeakerIdsToDTO(session.getSpeakerIds()));
        sessionDTO.setReviews(reviewsMapper.convertToDTO(session.getReviews()));
        sessionDTO.setEventId(session.getEventId());
        sessionDTO.setStart(session.getStart());
        sessionDTO.setEnd(session.getEnd());
        sessionDTO.setTrack(session.getTrack());

        return sessionDTO;
    }

    public Session convertToEntity(SessionDTO sessionDTO) {
        if(sessionDTO == null) {
            return null;
        }

        Session session = new Session();
        session.setId(sessionDTO.getId());
        session.setTitle(sessionDTO.getTitle());
        session.setAbstractText(sessionDTO.getAbstractText());
        session.setDeliberationStatus(sessionDTO.getDeliberationStatus());
        session.setConfirmationStatus(sessionDTO.getConfirmationStatus());
        session.setLevel(sessionDTO.getLevel());
        session.setReferences(sessionDTO.getReferences());
        session.setFormats(convertFormatsToEntity(sessionDTO.getFormats()));
        session.setCategories(convertCategoriesToEntity(sessionDTO.getCategories()));
        session.setTags(sessionDTO.getTags());
        session.setLanguages(sessionDTO.getLanguages());
        session.setSpeakerIds(extractSpeakerIds(sessionDTO.getSpeakers()));
        session.setReviews(reviewsMapper.convertToEntity(sessionDTO.getReviews()));
        session.setEventId(sessionDTO.getEventId());
        session.setStart(sessionDTO.getStart());
        session.setEnd(sessionDTO.getEnd());
        session.setTrack(sessionDTO.getTrack());

        return session;
    }

    public SessionReviewImportData toSessionImportData(Session session) {
        if (session == null) {
            return null;
        }

        SessionReviewImportData importData = new SessionReviewImportData();
        importData.setId(session.getId());
        importData.setTitle(session.getTitle());
        importData.setAbstractText(session.getAbstractText());
        importData.setDeliberationStatus(session.getDeliberationStatus());
        importData.setConfirmationStatus(session.getConfirmationStatus());
        importData.setLevel(session.getLevel());
        importData.setReferences(session.getReferences());
        importData.setEventId(session.getEventId());

        importData.setFormats(session.getFormats() != null ? session.getFormats() : new ArrayList<>());
        importData.setCategories(session.getCategories() != null ? session.getCategories() : new ArrayList<>());
        importData.setTags(session.getTags() != null ? session.getTags() : new ArrayList<>());
        importData.setLanguages(session.getLanguages() != null ? session.getLanguages() : new ArrayList<>());

        if (session.getSpeakerIds() != null && !session.getSpeakerIds().isEmpty()) {
            List<Speaker> speakers = speakerService.findByIds(session.getSpeakerIds());
            importData.setSpeakers(speakers != null ? speakers : new ArrayList<>());
        } else {
            importData.setSpeakers(new ArrayList<>());
        }

        if (session.getReviews() != null) {
            importData.setReviews(session.getReviews());
        }

        return importData;
    }

    private List<SpeakerDTO> convertSpeakerIdsToDTO(List<String> speakerIds) {
        if (speakerIds == null || speakerIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Speaker> speakers = speakerService.findByIds(speakerIds);
        return speakers.stream()
                .map(this::convertSpeakerToDTO)
                .collect(Collectors.toList());
    }

    private List<String> extractSpeakerIds(List<SpeakerDTO> speakerDTOs) {
        if (speakerDTOs == null || speakerDTOs.isEmpty()) {
            return new ArrayList<>();
        }

        return speakerDTOs.stream()
                .map(SpeakerDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private SpeakerDTO convertSpeakerToDTO(Speaker speaker) {
        if (speaker == null) {
            return null;
        }

        SpeakerDTO speakerDTO = new SpeakerDTO();
        speakerDTO.setId(speaker.getId());
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

    private List<FormatDTO> convertFormatsToDTO(List<Format> formats) {
        if (formats == null) return new ArrayList<>();
        return formats.stream()
                .map(formatMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    private List<Format> convertFormatsToEntity(List<FormatDTO> formatDTOs) {
        if (formatDTOs == null) return new ArrayList<>();
        return formatDTOs.stream()
                .map(formatMapper::convertToEntity)
                .collect(Collectors.toList());
    }

    private List<CategoryDTO> convertCategoriesToDTO(List<Category> categories) {
        if (categories == null) return new ArrayList<>();
        return categories.stream()
                .map(categoryMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    private List<Category> convertCategoriesToEntity(List<CategoryDTO> categoryDTOs) {
        if (categoryDTOs == null) return new ArrayList<>();
        return categoryDTOs.stream()
                .map(categoryMapper::convertToEntity)
                .collect(Collectors.toList());
    }
}
