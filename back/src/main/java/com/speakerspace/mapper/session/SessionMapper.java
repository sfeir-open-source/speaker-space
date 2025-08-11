package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.CategoryDTO;
import com.speakerspace.dto.session.FormatDTO;
import com.speakerspace.dto.session.SessionDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.*;
import com.speakerspace.utils.date.EventDateCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
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
    private ReviewsMapper reviewsMapper;

    @Autowired
    private SpeakerMapper speakerMapper;

    public SessionDTO convertToDTO(Session session) {
        if(session == null) return null;

        ZoneId eventZone = ZoneId.of("Europe/Paris");

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
                convertSpeakersToDTO(session.getSpeakers()),
                reviewsMapper.convertToDTO(session.getReviews()),
                session.getEventId(),
                EventDateCalculator.convertLocalDateTimeToDate(session.getStart(), eventZone),
                EventDateCalculator.convertLocalDateTimeToDate(session.getEnd(), eventZone),
                session.getTrack(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    public Session convertToEntity(SessionDTO sessionDTO) {
        if(sessionDTO == null) return null;

        ZoneId eventZone = ZoneId.of("Europe/Paris");

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
        session.setSpeakers(convertSpeakersToEntity(sessionDTO.speakers()));
        session.setReviews(reviewsMapper.convertToEntity(sessionDTO.reviews()));
        session.setEventId(sessionDTO.eventId());
        session.setStart(EventDateCalculator.convertLocalDateTimeToDate(sessionDTO.start(), eventZone));
        session.setEnd(EventDateCalculator.convertLocalDateTimeToDate(sessionDTO.end(), eventZone));
        session.setTrack(sessionDTO.track());
        session.setCreatedAt(sessionDTO.createdAt());
        session.setUpdatedAt(sessionDTO.updatedAt());

        return session;
    }

    public SessionImportData toSessionImportData(Session session) {
        if (session == null) return null;

        SessionImportData importData = new SessionImportData();
        importData.setId(session.getId());
        importData.setTitle(session.getTitle());
        importData.setAbstractText(session.getAbstractText());
        importData.setDeliberationStatus(session.getDeliberationStatus());
        importData.setConfirmationStatus(session.getConfirmationStatus());
        importData.setLevel(session.getLevel());
        importData.setReferences(session.getReferences());
        importData.setEventId(session.getEventId());
        importData.setStart(session.getStart());
        importData.setEnd(session.getEnd());
        importData.setTrack(session.getTrack());
        importData.setFormats(session.getFormats() != null ? session.getFormats() : new ArrayList<>());
        importData.setCategories(session.getCategories() != null ? session.getCategories() : new ArrayList<>());
        importData.setTags(session.getTags() != null ? session.getTags() : new ArrayList<>());
        importData.setLanguages(session.getLanguages() != null ? session.getLanguages() : new ArrayList<>());

        importData.setSpeakers(session.getSpeakers() != null ? session.getSpeakers() : new ArrayList<>());

        if (session.getReviews() != null) {
            importData.setReviews(session.getReviews());
        }

        return importData;
    }

    private List<SpeakerDTO> convertSpeakersToDTO(List<Speaker> speakers) {
        if (speakers == null || speakers.isEmpty()) {
            return new ArrayList<>();
        }

        return speakers.stream()
                .map(speakerMapper::convertToDTO)
                .collect(Collectors.toList());
    }

    private List<Speaker> convertSpeakersToEntity(List<SpeakerDTO> speakerDTOs) {
        if (speakerDTOs == null || speakerDTOs.isEmpty()) {
            return new ArrayList<>();
        }

        return speakerDTOs.stream()
                .map(speakerMapper::convertToEntity)
                .collect(Collectors.toList());
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
