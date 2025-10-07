package com.speakerspace.mapper.session;

import com.speakerspace.dto.session.ProposalScheduleDTO;
import com.speakerspace.dto.session.SessionScheduleImportDataDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.Category;
import com.speakerspace.model.session.Format;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.utils.date.EventDateCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class SessionScheduleMapper {

    private final Clock clock;

    public SessionScheduleImportDataDTO convertUtcToLocalDateTime(SessionScheduleImportDataDTO original) {
        try {
            LocalDateTime convertedStart = convertUtcStringToLocalDateTime(original.start());
            LocalDateTime convertedEnd = convertUtcStringToLocalDateTime(original.end());

            return SessionScheduleImportDataDTO.builder()
                    .id(original.id())
                    .start(convertedStart)
                    .end(convertedEnd)
                    .track(original.track())
                    .title(original.title())
                    .languages(original.languages())
                    .proposal(original.proposal())
                    .eventId(original.eventId())
                    .build();

        } catch (Exception e) {
            log.warn("Failed to convert UTC times for session {}, using original values", original.id());
            return original;
        }
    }

    public Session createSessionFromScheduleData(SessionScheduleImportDataDTO scheduleData, String eventId) {
        Session session = new Session();
        ZoneId eventZone = ZoneId.of("Europe/Paris");

        String conferenceHallId = extractConferenceHallId(scheduleData);

        session.setId(generateSessionId());
        session.setIdConferenceHall(conferenceHallId);
        session.setTitle(scheduleData.title());
        session.setStart(EventDateCalculator.convertLocalDateTimeToDate(scheduleData.start(), eventZone));
        session.setEnd(EventDateCalculator.convertLocalDateTimeToDate(scheduleData.end(), eventZone));
        session.setTrack(scheduleData.track());
        session.setEventId(eventId);

        if (scheduleData.languages() != null && !scheduleData.languages().trim().isEmpty()) {
            session.setLanguages(List.of(scheduleData.languages()));
        }

        if (scheduleData.proposal() != null) {
            enrichSessionWithProposalData(session, scheduleData.proposal(), eventId);
        }

        return session;
    }

    public void enrichExistingSessionWithScheduleData(Session existingSession, SessionScheduleImportDataDTO scheduleData) {
        ZoneId eventZone = ZoneId.of("Europe/Paris");
        Date now = EventDateCalculator.convertLocalDateTimeToDate(LocalDateTime.now(clock), eventZone);

        existingSession.setStart(EventDateCalculator.convertLocalDateTimeToDate(scheduleData.start(), eventZone));
        existingSession.setEnd(EventDateCalculator.convertLocalDateTimeToDate(scheduleData.end(), eventZone));
        existingSession.setTrack(scheduleData.track());

        if (scheduleData.title() != null && !scheduleData.title().trim().isEmpty()) {
            existingSession.setTitle(scheduleData.title());
        }

        if (scheduleData.languages() != null && !scheduleData.languages().trim().isEmpty()) {
            existingSession.setLanguages(List.of(scheduleData.languages()));
        }

        existingSession.setUpdatedAt(now);
    }

    public List<Speaker> convertScheduleSpeakersToSpeakers(List<SpeakerDTO> scheduleSpeakers, String eventId) {
        if (scheduleSpeakers == null || scheduleSpeakers.isEmpty()) {
            return new ArrayList<>();
        }

        return scheduleSpeakers.stream()
                .map(scheduleSpeaker -> convertScheduleSpeakerToSpeaker(scheduleSpeaker, eventId))
                .toList();
    }

    public String extractConferenceHallId(SessionScheduleImportDataDTO scheduleData) {
        return scheduleData.proposal() != null && scheduleData.proposal().id() != null
                ? scheduleData.proposal().id()
                : scheduleData.id();
    }

    private void enrichSessionWithProposalData(Session session, ProposalScheduleDTO proposal, String eventId) {
        session.setAbstractText(proposal.abstractText());
        session.setLevel(proposal.level());

        if (proposal.formats() != null) {
            session.setFormats(convertStringFormatsToObjects(proposal.formats()));
        }
        if (proposal.categories() != null) {
            session.setCategories(convertStringCategoriesToObjects(proposal.categories()));
        }
        if (proposal.speakers() != null) {
            List<Speaker> speakers = convertScheduleSpeakersToSpeakers(proposal.speakers(), eventId);
            session.setSpeakers(speakers);
        }
    }

    private Speaker convertScheduleSpeakerToSpeaker(SpeakerDTO scheduleSpeaker, String eventId) {
        Speaker speaker = new Speaker();
        speaker.setId(generateSpeakerId());
        speaker.setIdConferenceHall(scheduleSpeaker.id());
        speaker.setName(scheduleSpeaker.name());
        speaker.setBio(scheduleSpeaker.bio());
        speaker.setCompany(scheduleSpeaker.company());
        speaker.setPicture(scheduleSpeaker.picture());
        speaker.setEventId(eventId);
        speaker.setSocialLinks(scheduleSpeaker.socialLinks() != null ?
                scheduleSpeaker.socialLinks() : new ArrayList<>());
        return speaker;
    }

    private LocalDateTime convertUtcStringToLocalDateTime(LocalDateTime dateTime) {
        return dateTime;
    }

    private List<Format> convertStringFormatsToObjects(List<String> formatStrings) {
        return formatStrings.stream()
                .map(this::createFormatFromString)
                .toList();
    }

    private List<Category> convertStringCategoriesToObjects(List<String> categoryStrings) {
        return categoryStrings.stream()
                .map(this::createCategoryFromString)
                .toList();
    }

    private Format createFormatFromString(String formatString) {
        Format format = new Format();
        format.setId(generateIdFromString(formatString));
        format.setName(formatString);
        format.setDescription(formatString);
        return format;
    }

    private Category createCategoryFromString(String categoryString) {
        Category category = new Category();
        category.setId(generateIdFromString(categoryString));
        category.setName(categoryString);
        category.setDescription(categoryString);
        return category;
    }

    private String generateIdFromString(String content) {
        return content.toLowerCase()
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    private String generateSessionId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private String generateSpeakerId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
