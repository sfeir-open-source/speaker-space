package com.speakerspace.service;

import com.speakerspace.dto.session.*;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.model.session.*;
import com.speakerspace.repository.SessionRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;
    private final SpeakerService speakerService;

    public SessionService(SessionRepository sessionRepository, SessionMapper sessionMapper, SpeakerService speakerService) {
        this.sessionRepository = sessionRepository;
        this.sessionMapper = sessionMapper;
        this.speakerService = speakerService;
    }

    public ImportResultDTO importSessionsReview(String eventId, List<SessionReviewImportDataDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();

        for (SessionReviewImportDataDTO importData : importDataList) {
            try {
                SessionDTO sessionDTO = convertImportDataToSessionDTO(importData, eventId);

                List<String> speakerIds = processSpeakersForSession(sessionDTO.getSpeakers(), eventId);

                Session session = sessionMapper.convertToEntity(sessionDTO);
                session.setSpeakerIds(speakerIds);

                sessionRepository.save(session);
                successfulImports.add(importData.getId());

            } catch (Exception e) {
                failedImports.add(importData.getId());
            }
        }

        return new ImportResultDTO(successfulImports, failedImports);
    }

    public ImportResultDTO importSessionsSchedule(String eventId, List<SessionScheduleImportDataDTO> importDataList) {
        List<String> successfulImports = new ArrayList<>();
        List<String> failedImports = new ArrayList<>();

        for (SessionScheduleImportDataDTO scheduleData : importDataList) {
            try {
                String sessionId = scheduleData.getProposal() != null && scheduleData.getProposal().getId() != null
                        ? scheduleData.getProposal().getId()
                        : scheduleData.getId();

                Session existingSession = sessionRepository.findById(sessionId);

                if (existingSession != null) {
                    enrichExistingSessionWithScheduleData(existingSession, scheduleData);
                    sessionRepository.save(existingSession);
                } else {
                    Session newSession = createSessionFromScheduleData(scheduleData, eventId);
                    sessionRepository.save(newSession);
                }

                successfulImports.add(sessionId);

            } catch (Exception e) {
                String sessionId = scheduleData.getProposal() != null ? scheduleData.getProposal().getId() : scheduleData.getId();
                failedImports.add(sessionId);
            }
        }

        return new ImportResultDTO(successfulImports, failedImports);
    }

    public SessionDTO updateSessionSchedule(String sessionId, String eventId, SessionScheduleUpdateDTO scheduleUpdate) {
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

    public List<String> getDistinctTracksByEventId(String eventId) {
        return sessionRepository.findDistinctTracksByEventId(eventId);
    }

    private void enrichExistingSessionWithScheduleData(Session existingSession, SessionScheduleImportDataDTO scheduleData) {
        existingSession.setStart(scheduleData.getStart());
        existingSession.setEnd(scheduleData.getEnd());
        existingSession.setTrack(scheduleData.getTrack());

        if (scheduleData.getLanguages() != null && !scheduleData.getLanguages().trim().isEmpty()) {
            List<String> newLanguages = Arrays.asList(scheduleData.getLanguages());
            if (existingSession.getLanguages() == null || existingSession.getLanguages().isEmpty()) {
                existingSession.setLanguages(newLanguages);
            }
        }

        if (scheduleData.getProposal() != null) {
            enrichSessionWithProposalData(existingSession, scheduleData.getProposal());
        }
    }

    private void enrichSessionWithProposalData(Session session, ProposalScheduleDTO proposalData) {
        if (isBlank(session.getAbstractText()) && !isBlank(proposalData.getAbstractText())) {
            session.setAbstractText(proposalData.getAbstractText());
        }

        if (isBlank(session.getLevel()) && !isBlank(proposalData.getLevel())) {
            session.setLevel(proposalData.getLevel());
        }

        if (proposalData.getFormats() != null && !proposalData.getFormats().isEmpty()) {
            List<Format> convertedFormats = convertStringFormatsToObjects(proposalData.getFormats());
            if (session.getFormats() == null || session.getFormats().isEmpty()) {
                session.setFormats(convertedFormats);
            }
        }

        if (proposalData.getCategories() != null && !proposalData.getCategories().isEmpty()) {
            List<Category> convertedCategories = convertStringCategoriesToObjects(proposalData.getCategories());
            if (session.getCategories() == null || session.getCategories().isEmpty()) {
                session.setCategories(convertedCategories);
            }
        }

        if (proposalData.getSpeakers() != null && !proposalData.getSpeakers().isEmpty()) {
            List<Speaker> convertedSpeakers = convertScheduleSpeakersToSpeakers(proposalData.getSpeakers());
            List<String> speakerIds = speakerService.processSpeakers(convertedSpeakers, session.getEventId());
            enrichSpeakersData(session, speakerIds);
        }
    }

    private void enrichSpeakersData(Session session, List<String> newSpeakerIds) {
        if (newSpeakerIds == null || newSpeakerIds.isEmpty()) {
            return;
        }

        Set<String> existingSpeakerIds = new HashSet<>(session.getSpeakerIds() != null ? session.getSpeakerIds() : new ArrayList<>());
        existingSpeakerIds.addAll(newSpeakerIds);

        session.setSpeakerIds(new ArrayList<>(existingSpeakerIds));
    }

    private Session createSessionFromScheduleData(SessionScheduleImportDataDTO scheduleData, String eventId) {
        Session session = new Session();

        String sessionId = scheduleData.getProposal() != null && scheduleData.getProposal().getId() != null
                ? scheduleData.getProposal().getId()
                : scheduleData.getId();

        session.setId(sessionId);
        session.setTitle(scheduleData.getTitle());
        session.setStart(scheduleData.getStart());
        session.setEnd(scheduleData.getEnd());
        session.setTrack(scheduleData.getTrack());
        session.setEventId(eventId);

        if (scheduleData.getLanguages() != null) {
            session.setLanguages(Arrays.asList(scheduleData.getLanguages()));
        }

        if (scheduleData.getProposal() != null) {
            ProposalScheduleDTO proposal = scheduleData.getProposal();

            session.setAbstractText(proposal.getAbstractText());
            session.setLevel(proposal.getLevel());

            if (proposal.getFormats() != null) {
                session.setFormats(convertStringFormatsToObjects(proposal.getFormats()));
            }
            if (proposal.getCategories() != null) {
                session.setCategories(convertStringCategoriesToObjects(proposal.getCategories()));
            }
            if (proposal.getSpeakers() != null) {
                List<Speaker> speakers = convertScheduleSpeakersToSpeakers(proposal.getSpeakers());
                List<String> speakerIds = speakerService.processSpeakers(speakers, eventId);
                session.setSpeakerIds(speakerIds);
            }
        }

        return session;
    }

    private List<String> processSpeakersForSession(List<SpeakerDTO> speakerDTOs, String eventId) {
        if (speakerDTOs == null || speakerDTOs.isEmpty()) {
            return new ArrayList<>();
        }

        List<Speaker> speakers = speakerDTOs.stream()
                .map(this::convertSpeakerDTOToEntity)
                .collect(Collectors.toList());

        return speakerService.processSpeakers(speakers, eventId);
    }

    private Speaker convertSpeakerDTOToEntity(SpeakerDTO speakerDTO) {
        Speaker speaker = new Speaker();
        speaker.setId(speakerDTO.getId());
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

    public List<SessionReviewImportData> getSessionsReviewAsImportData(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);
        return sessions.stream()
                .map(sessionMapper::toSessionImportData)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
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

    public List<SpeakerWithSessionsDTO> getSpeakersWithSessionsByEventId(String eventId) {
        List<Speaker> speakers = speakerService.findByEventId(eventId);

        List<Session> sessions = sessionRepository.findByEventId(eventId);

        return speakers.stream()
                .map(speaker -> {
                    List<SessionReviewImportData> speakerSessions = sessions.stream()
                            .filter(session -> session.getSpeakerIds() != null &&
                                    session.getSpeakerIds().contains(speaker.getId()))
                            .map(sessionMapper::toSessionImportData)
                            .collect(Collectors.toList());

                    return new SpeakerWithSessionsDTO(speaker, speakerSessions);
                })
                .sorted(Comparator.comparing(dto -> dto.getSpeaker().getName().toLowerCase()))
                .collect(Collectors.toList());
    }

    private SessionDTO convertImportDataToSessionDTO(SessionReviewImportDataDTO importData, String eventId) {
        SessionDTO sessionDTO = new SessionDTO();
        sessionDTO.setId(importData.getId());
        sessionDTO.setTitle(importData.getTitle());
        sessionDTO.setAbstractText(importData.getAbstractText());
        sessionDTO.setDeliberationStatus(importData.getDeliberationStatus());
        sessionDTO.setConfirmationStatus(importData.getConfirmationStatus());
        sessionDTO.setLevel(importData.getLevel());
        sessionDTO.setReferences(importData.getReferences());
        sessionDTO.setEventId(eventId);
        sessionDTO.setFormats(defaultIfNull(importData.getFormats(), new ArrayList<>()));
        sessionDTO.setCategories(defaultIfNull(importData.getCategories(), new ArrayList<>()));
        sessionDTO.setTags(defaultIfNull(importData.getTags(), new ArrayList<>()));
        sessionDTO.setLanguages(defaultIfNull(importData.getLanguages(), new ArrayList<>()));
        sessionDTO.setSpeakers(defaultIfNull(importData.getSpeakers(), new ArrayList<>()));
        sessionDTO.setReviews(importData.getReviews());
        return sessionDTO;
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    private <T> T defaultIfNull(T value, T defaultValue) {
        return value != null ? value : defaultValue;
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
                .collect(Collectors.toList());
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
                .collect(Collectors.toList());
    }

    private List<Speaker> convertScheduleSpeakersToSpeakers(List<SpeakerScheduleDTO> scheduleSpeakers) {
        return scheduleSpeakers.stream()
                .map(scheduleSpeaker -> {
                    Speaker speaker = new Speaker();
                    speaker.setId(scheduleSpeaker.getId());
                    speaker.setName(scheduleSpeaker.getName());
                    speaker.setBio(scheduleSpeaker.getBio());
                    speaker.setCompany(scheduleSpeaker.getCompany());
                    speaker.setPicture(scheduleSpeaker.getPicture());
                    speaker.setSocialLinks(scheduleSpeaker.getSocialLinks() != null ?
                            scheduleSpeaker.getSocialLinks() : new ArrayList<>());
                    return speaker;
                })
                .collect(Collectors.toList());
    }

    private String generateIdFromString(String content) {
        return content.toLowerCase()
                .replaceAll("[^a-z0-9]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "");
    }

    public boolean deleteSession(String id) {
        Session existingSession = sessionRepository.findById(id);
        if (existingSession == null) {
            return false;
        }
        return sessionRepository.delete(id);
    }

    public List<SessionDTO> getSessionsWithScheduleByEventId(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);
        return sessions.stream()
                .map(sessionMapper::convertToDTO)
                .filter(Objects::nonNull)
                .filter(session -> session.getStart() != null && session.getEnd() != null)
                .collect(Collectors.toList());
    }
}
