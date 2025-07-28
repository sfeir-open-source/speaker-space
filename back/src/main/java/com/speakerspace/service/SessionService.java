package com.speakerspace.service;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.dto.session.*;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.session.*;
import com.speakerspace.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import com.speakerspace.utils.date.EventDateCalculator;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final SpeakerService speakerService;
    private final SpeakerMapper speakerMapper;
    private final Clock clock;

    @Autowired
    private EventService eventService;

    public boolean deleteSession(String id) {
        Session existingSession = sessionRepository.findSessionById(id);
        if (existingSession == null) {
            return false;
        }
        return sessionRepository.deleteSession(id);
    }

    public List<String> getDistinctTracksByEventId(String eventId) {
        return sessionRepository.findDistinctTracksByEventId(eventId);
    }

    public ImportResultDTO importSessionsReview(String eventId, List<SessionDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (SessionDTO importData : importDataList) {
            try {
                SessionDTO sessionDTO = convertImportDataToSessionDTO(importData, eventId);

                List<String> speakerIds = processSpeakersForSession(sessionDTO.speakers(), eventId);

                Session session = sessionMapper.convertToEntity(sessionDTO);
                session.setSpeakerIds(speakerIds);

                sessionRepository.saveSession(session);
                successfulImports.add(importData.id());
                log.info("Successfully imported session {}, ", importData.id());

            } catch (Exception e) {
                log.error("Failed to import session {}", importData.id(), e);
                failedImports.add(importData.id());
                errors.add("Failed to import session " + importData.id() + ": " + e.getMessage());
            }
        }

        return ImportResultDTO.builder()
                .successfulImports(successfulImports)
                .failedImports(failedImports)
                .totalCount(importDataList.size())
                .successCount(successfulImports.size())
                .errors(errors)
                .build();
    }

    public ImportResultDTO importSessionsSchedule(String eventId, List<SessionScheduleImportDataDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        EventDTO event = eventService.getEventById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        List<SessionScheduleImportDataDTO> convertedSessions = importDataList.stream()
                .map(this::convertUtcToLocalDateTime)
                .collect(Collectors.toList());

        eventService.updateEventDatesFromSessions(eventId, convertedSessions);

        for (SessionScheduleImportDataDTO scheduleData : convertedSessions) {
            String sessionId = null;
            try {
                sessionId = scheduleData.proposal() != null && scheduleData.proposal().id() != null
                        ? scheduleData.proposal().id()
                        : scheduleData.id();

                Session existingSession = sessionRepository.findSessionById(sessionId);

                if (existingSession != null) {
                    enrichExistingSessionWithScheduleData(existingSession, scheduleData);
                    sessionRepository.saveSession(existingSession);
                    log.info("Successfully updated session {} ", existingSession.getId());
                } else {
                    Session newSession = createSessionFromScheduleData(scheduleData, eventId);
                    sessionRepository.saveSession(newSession);
                    log.info("Successfully created new session {} ", newSession.getId());
                }

                successfulImports.add(sessionId);

            } catch (Exception e) {
                String finalSessionId = sessionId != null ? sessionId :
                        (scheduleData.proposal() != null ? scheduleData.proposal().id() : scheduleData.id());
                failedImports.add(finalSessionId);
                errors.add("Failed to import schedule for session " + finalSessionId + ": " + e.getMessage());
            }
        }

        return ImportResultDTO.builder()
                .successfulImports(successfulImports)
                .failedImports(failedImports)
                .totalCount(importDataList.size())
                .successCount(successfulImports.size())
                .errors(errors)
                .build();
    }

    public SessionDTO createSession(String eventId, SessionCreateRequestDTO createRequest) {
        EventDTO event = eventService.getEventById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found: " + eventId);
        }

        String sessionId = generateSessionId();

        Session session = new Session();
        session.setId(sessionId);
        session.setTitle(createRequest.title().trim());
        session.setAbstractText(createRequest.abstractText() != null ? createRequest.abstractText().trim() : null);
        session.setReferences(createRequest.references() != null ? createRequest.references().trim() : null);
        session.setLevel(createRequest.level());
        session.setTrack(createRequest.track());
        session.setEventId(eventId);

        session.setDeliberationStatus(createRequest.deliberationStatus() != null ?
                createRequest.deliberationStatus() : "ACCEPTED");
        session.setConfirmationStatus(createRequest.confirmationStatus() != null ?
                createRequest.confirmationStatus() : "CONFIRMED");

        if (createRequest.start() != null) {
            session.setStart(createRequest.start());
        }
        if (createRequest.end() != null) {
            session.setEnd(createRequest.end());
        }

        session.setLanguages(createRequest.languages() != null ? createRequest.languages() : new ArrayList<>());
        session.setTags(new ArrayList<>());

        if (createRequest.formats() != null) {
            session.setFormats(createRequest.formats().stream()
                    .map(this::convertFormatDTOToEntity)
                    .collect(Collectors.toList()));
        } else {
            session.setFormats(new ArrayList<>());
        }

        if (createRequest.categories() != null) {
            session.setCategories(createRequest.categories().stream()
                    .map(this::convertCategoryDTOToEntity)
                    .collect(Collectors.toList()));
        } else {
            session.setCategories(new ArrayList<>());
        }

        if (createRequest.speakers() != null && !createRequest.speakers().isEmpty()) {
            List<String> speakerIds = createRequest.speakers().stream()
                    .map(SpeakerDTO::id)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            session.setSpeakerIds(speakerIds);
        } else {
            session.setSpeakerIds(new ArrayList<>());
        }

        sessionRepository.saveSession(session);

        log.info("Successfully created session {} '{}' for event {}",
                sessionId, createRequest.title(), eventId);
        return sessionMapper.convertToDTO(session);
    }

    private SessionScheduleImportDataDTO convertUtcToLocalDateTime(SessionScheduleImportDataDTO original) {
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
            return original;
        }
    }

    private LocalDateTime convertUtcStringToLocalDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime;
    }

    public List<SessionReviewImportData> getSessionsReviewAsImportData(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);

        return sessions.stream()
                .map(sessionMapper::toSessionImportData)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public SessionReviewImportData getSessionById(String eventId, String sessionId) {
        Session session = sessionRepository.findByIdAndEventId(sessionId, eventId);
        return session != null ? sessionMapper.toSessionImportData(session) : null;
    }

    public SessionDTO getSessionByIdAndEventId(String sessionId, String eventId) {
        Session session = sessionRepository.findByIdAndEventId(sessionId, eventId);
        return session != null ? sessionMapper.convertToDTO(session) : null;
    }

    public List<Speaker> getUniqueSpeekersByEventId(String eventId) {
        return speakerService.findByEventId(eventId);
    }

    public Speaker getSpeakerById(String eventId, String speakerId) {
        Speaker speaker = speakerService.findById(speakerId);
        if (speaker != null && eventId.equals(speaker.getEventId())) {
            return speaker;
        }
        return null;
    }

    public List<SessionDTO> getSessionsWithScheduleByEventId(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);

        return sessions.stream()
                .map(sessionMapper::convertToDTO)
                .filter(Objects::nonNull)
                .filter(session -> session.start() != null && session.end() != null)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public List<SpeakerWithSessionsDTO> getSpeakersWithSessionsByEventId(String eventId) {
        List<Speaker> speakers = speakerService.findByEventId(eventId);
        List<Session> sessions = sessionRepository.findByEventId(eventId);

        List<SpeakerWithSessionsDTO> result = speakers.stream()
                .map(speaker -> {
                    List<SessionReviewImportData> speakerSessions = sessions.stream()
                            .filter(session -> session.getSpeakerIds() != null &&
                                    session.getSpeakerIds().contains(speaker.getId()))
                            .map(sessionMapper::toSessionImportData)
                            .collect(Collectors.toCollection(ArrayList::new));

                    return new SpeakerWithSessionsDTO(speaker, speakerSessions);
                })
                .collect(Collectors.toCollection(ArrayList::new));

        result.sort(Comparator.comparing(dto -> dto.speaker().getName().toLowerCase()));

        return result;
    }

    public SessionDTO updateSessionSchedule(String sessionId, String eventId, Session scheduleUpdate) {
        if (!sessionRepository.existsByIdAndEventId(sessionId, eventId)) {
            throw new IllegalArgumentException("Session not found or does not belong to the specified event");
        }

        Date startDate = scheduleUpdate.getStart();
        Date endDate = scheduleUpdate.getEnd();
        String track = scheduleUpdate.getTrack();

        log.debug("Updating session {} with start: {}, end: {}, track: {}",
                sessionId, startDate, endDate, track);

        Session updatedSession = sessionRepository.updateScheduleFields(
                sessionId,
                startDate,
                endDate,
                track
        );

        if (updatedSession == null) {
            throw new RuntimeException("Failed to update session schedule");
        }

        return sessionMapper.convertToDTO(updatedSession);
    }

    private Session createSessionFromScheduleData(SessionScheduleImportDataDTO scheduleData, String eventId) {
        Session session = new Session();

        ZoneId eventZone = ZoneId.of("Europe/Paris"); // TODO : get zone from Event object

        String sessionId = scheduleData.proposal() != null && scheduleData.proposal().id() != null
                ? scheduleData.proposal().id()
                : scheduleData.id();

        session.setId(sessionId);
        session.setTitle(scheduleData.title());
        session.setStart(EventDateCalculator.convertLocalDateTimeToDate(scheduleData.start(), eventZone));
        session.setEnd(EventDateCalculator.convertLocalDateTimeToDate(scheduleData.end(), eventZone));
        session.setTrack(scheduleData.track());
        session.setEventId(eventId);

        if (scheduleData.languages() != null && !scheduleData.languages().trim().isEmpty()) {
            session.setLanguages(List.of(scheduleData.languages()));
        }

        if (scheduleData.proposal() != null) {
            ProposalScheduleDTO proposal = scheduleData.proposal();

            session.setAbstractText(proposal.abstractText());
            session.setLevel(proposal.level());

            if (proposal.formats() != null) {
                session.setFormats(convertStringFormatsToObjects(proposal.formats()));
            }
            if (proposal.categories() != null) {
                session.setCategories(convertStringCategoriesToObjects(proposal.categories()));
            }
            if (proposal.speakers() != null) {
                List<Speaker> speakers = convertScheduleSpeakersToSpeakers(proposal.speakers());
                List<String> speakerIds = speakerService.processSpeakers(speakers, eventId);
                session.setSpeakerIds(speakerIds);
            }
        }

        return session;
    }

    private void enrichExistingSessionWithScheduleData(Session existingSession, SessionScheduleImportDataDTO scheduleData) {
        ZoneId eventZone = ZoneId.of("Europe/Paris"); // TODO : get zone from Event object
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

    private List<String> processSpeakersForSession(List<SpeakerDTO> speakerDTOs, String eventId) {
        if (speakerDTOs == null || speakerDTOs.isEmpty()) {
            return new ArrayList<>();
        }

        List<Speaker> speakers = speakerDTOs.stream()
                .map(speakerMapper::convertToEntity)
                .toList();

        return speakerService.processSpeakers(speakers, eventId);
    }

    private SessionDTO convertImportDataToSessionDTO(SessionDTO importData, String eventId) {
        return SessionDTO.builder()
                .id(importData.id())
                .title(importData.title())
                .abstractText(importData.abstractText())
                .deliberationStatus(importData.deliberationStatus())
                .confirmationStatus(importData.confirmationStatus())
                .level(importData.level())
                .references(importData.references())
                .eventId(eventId)
                .start(importData.start())
                .end(importData.end())
                .track(importData.track())
                .formats(defaultIfNull(importData.formats(), new ArrayList<>()))
                .categories(defaultIfNull(importData.categories(), new ArrayList<>()))
                .tags(defaultIfNull(importData.tags(), new ArrayList<>()))
                .languages(defaultIfNull(importData.languages(), new ArrayList<>()))
                .speakers(defaultIfNull(importData.speakers(), new ArrayList<>()))
                .reviews(importData.reviews())
                .build();
    }

    private List<Format> convertStringFormatsToObjects(List<String> formatStrings) {
        return formatStrings.stream()
                .map(formatString -> {
                    Format format = new Format();
                    format.setId(generateIdFromString(formatString));
                    format.setName(formatString);
                    format.setDescription(formatString);
                    return format;
                })
                .toList();
    }

    private List<Category> convertStringCategoriesToObjects(List<String> categoryStrings) {
        return categoryStrings.stream()
                .map(categoryString -> {
                    Category category = new Category();
                    category.setId(generateIdFromString(categoryString));
                    category.setName(categoryString);
                    category.setDescription(categoryString);
                    return category;
                })
                .toList();
    }

    private List<Speaker> convertScheduleSpeakersToSpeakers(List<SpeakerDTO> scheduleSpeakers) {
        return scheduleSpeakers.stream()
                .map(scheduleSpeaker -> {
                    Speaker speaker = new Speaker();
                    speaker.setId(scheduleSpeaker.id());
                    speaker.setName(scheduleSpeaker.name());
                    speaker.setBio(scheduleSpeaker.bio());
                    speaker.setCompany(scheduleSpeaker.company());
                    speaker.setPicture(scheduleSpeaker.picture());
                    speaker.setSocialLinks(scheduleSpeaker.socialLinks() != null ?
                            scheduleSpeaker.socialLinks() : new ArrayList<>());
                    return speaker;
                })
                .toList();
    }

    private <T> T defaultIfNull(T value, T defaultValue) {
        return value != null ? value : defaultValue;
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

    private Format convertFormatDTOToEntity(FormatDTO formatDTO) {
        Format format = new Format();
        format.setId(formatDTO.id());
        format.setName(formatDTO.name());
        format.setDescription(formatDTO.description());
        return format;
    }

    private Category convertCategoryDTOToEntity(CategoryDTO categoryDTO) {
        Category category = new Category();
        category.setId(categoryDTO.id());
        category.setName(categoryDTO.name());
        category.setDescription(categoryDTO.description());
        return category;
    }
}
