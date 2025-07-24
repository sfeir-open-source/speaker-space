package com.speakerspace.service;

import com.speakerspace.dto.session.*;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.session.*;
import com.speakerspace.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final SpeakerService speakerService;
    private final SpeakerMapper speakerMapper;

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

            } catch (Exception e) {
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

        for (SessionScheduleImportDataDTO scheduleData : importDataList) {
            String sessionId = null;
            try {
                sessionId = scheduleData.proposal() != null && scheduleData.proposal().id() != null
                        ? scheduleData.proposal().id()
                        : scheduleData.id();

                Session existingSession = sessionRepository.findSessionById(sessionId);

                if (existingSession != null) {
                    enrichExistingSessionWithScheduleData(existingSession, scheduleData);
                    sessionRepository.saveSession(existingSession);
                } else {
                    Session newSession = createSessionFromScheduleData(scheduleData, eventId);
                    sessionRepository.saveSession(newSession);
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

        Session updatedSession = sessionRepository.updateScheduleFields(
                sessionId,
                scheduleUpdate.getStart(),
                scheduleUpdate.getEnd(),
                scheduleUpdate.getTrack()
        );

        if (updatedSession == null) {
            throw new RuntimeException("Failed to update session schedule");
        }

        return sessionMapper.convertToDTO(updatedSession);
    }

    private Session createSessionFromScheduleData(SessionScheduleImportDataDTO scheduleData, String eventId) {
        Session session = new Session();

        String sessionId = scheduleData.proposal() != null && scheduleData.proposal().id() != null
                ? scheduleData.proposal().id()
                : scheduleData.id();

        session.setId(sessionId);
        session.setTitle(scheduleData.title());
        session.setStart(scheduleData.start());
        session.setEnd(scheduleData.end());
        session.setTrack(scheduleData.track());
        session.setEventId(eventId);

        if (scheduleData.languages() != null) {
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

    private void enrichExistingSessionWithScheduleData(Session session, SessionScheduleImportDataDTO scheduleData) {
        session.setStart(scheduleData.start());
        session.setEnd(scheduleData.end());
        session.setTrack(scheduleData.track());
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
}
