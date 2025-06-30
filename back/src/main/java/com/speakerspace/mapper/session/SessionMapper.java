package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.CategoryDTO;
import com.speakerspace.dto.session.FormatDTO;
import com.speakerspace.dto.session.SessionDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class SessionMapper {

    @Autowired
    private FormatMapper formatMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private SpeakerMapper speakerMapper;

    @Autowired
    private ReviewsMapper reviewsMapper;

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
        sessionDTO.setSpeakers(convertSpeakersToDTO(session.getSpeakers()));
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
        session.setSpeakers(convertSpeakersToEntity(sessionDTO.getSpeakers()));
        session.setReviews(reviewsMapper.convertToEntity(sessionDTO.getReviews()));
        session.setEventId(sessionDTO.getEventId());
        session.setStart(sessionDTO.getStart());
        session.setEnd(sessionDTO.getEnd());
        session.setTrack(sessionDTO.getTrack());

        return session;
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

    private List<SpeakerDTO> convertSpeakersToDTO(List<Speaker> speakers) {
        if (speakers == null) return new ArrayList<>();
        return speakers.stream()
                .map(speakerMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    private List<Speaker> convertSpeakersToEntity(List<SpeakerDTO> speakerDTOs) {
        if (speakerDTOs == null) return new ArrayList<>();
        return speakerDTOs.stream()
                .map(speakerMapper::convertToEntity)
                .collect(Collectors.toList());
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

        if (session.getFormats() != null) {
            importData.setFormats(session.getFormats());
        } else {
            importData.setFormats(new ArrayList<>());
        }

        if (session.getCategories() != null) {
            importData.setCategories(session.getCategories());
        } else {
            importData.setCategories(new ArrayList<>());
        }

        if (session.getTags() != null) {
            importData.setTags(session.getTags());
        } else {
            importData.setTags(new ArrayList<>());
        }

        if (session.getLanguages() != null) {
            importData.setLanguages(session.getLanguages());
        } else {
            importData.setLanguages(new ArrayList<>());
        }

        if (session.getSpeakers() != null) {
            importData.setSpeakers(session.getSpeakers());
        } else {
            importData.setSpeakers(new ArrayList<>());
        }

        if (session.getReviews() != null) {
            importData.setReviews(session.getReviews());
        }

        return importData;
    }
}
