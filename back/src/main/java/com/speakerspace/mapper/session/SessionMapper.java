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
        if(session  == null) return null;

        return new SessionDTO(
            session.getId(),
            session.getTitle(),
            session.getAbstractText(),
            session.getDeliberationStatus(),
            session.getConfirmationStatus(),
            session.getLevel(),
            session.getReferences(),
            convertFormatsToDTO(session.getFormats()),
            convertCategoriesToDTO(session.getCategories()),
            session.getTags(),
            session.getLanguages(),
            convertSpeakerIdsToDTO(session.getSpeakerIds()),
            reviewsMapper.convertToDTO(session.getReviews()),
            session.getEventId(),
            session.getStart(),
            session.getEnd(),
            session.getTrack()
        );
    }

    public Session convertToEntity(SessionDTO sessionDTO) {
        if(sessionDTO  == null) return null;

        Session session = new Session();
        session.setId(sessionDTO.id());
        session.setTitle(sessionDTO.title());
        session.setAbstractText(sessionDTO.abstractText());
        session.setDeliberationStatus(sessionDTO.deliberationStatus());
        session.setConfirmationStatus(sessionDTO.confirmationStatus());
        session.setLevel(sessionDTO.level());
        session.setReferences(sessionDTO.references());
        session.setFormats(convertFormatsToEntity(sessionDTO.formats()));
        session.setCategories(convertCategoriesToEntity(sessionDTO.categories()));
        session.setTags(sessionDTO.tags());
        session.setLanguages(sessionDTO.languages());
        session.setSpeakerIds(extractSpeakerIds(sessionDTO.speakers()));
        session.setReviews(reviewsMapper.convertToEntity(sessionDTO.reviews()));
        session.setEventId(sessionDTO.eventId());
        session.setStart(sessionDTO.start());
        session.setEnd(sessionDTO.end());
        session.setTrack(sessionDTO.track());

        return session;
    }

    public SessionReviewImportData toSessionImportData(Session session) {
        if (session  == null) return null;

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
                .map(SpeakerDTO::id)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private SpeakerDTO convertSpeakerToDTO(Speaker speaker) {
        if (speaker == null) {
            return null;
        }

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
