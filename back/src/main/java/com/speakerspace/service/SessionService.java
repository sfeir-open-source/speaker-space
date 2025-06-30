package com.speakerspace.service;

import com.speakerspace.dto.session.*;
import com.speakerspace.mapper.session.SessionMapper;
import com.speakerspace.model.session.*;
import com.speakerspace.repository.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SessionService {

    private final SessionRepository sessionRepository;
    private final SessionMapper sessionMapper;

    public SessionService(SessionRepository sessionRepository, SessionMapper sessionMapper) {
        this.sessionRepository = sessionRepository;
        this.sessionMapper = sessionMapper;
    }

    public ImportResultDTO importSessionsReview(String eventId, List<SessionReviewImportDataDTO> sessionsData) {
        return processImport(sessionsData, (sessionData, index) -> {
            validateSessionReviewData(sessionData);
            SessionDTO sessionDTO = convertImportDataToSessionDTO(sessionData, eventId);
            Session session = sessionMapper.convertToEntity(sessionDTO);
            sessionRepository.save(session);
        });
    }

    public ImportResultDTO importSessionsSchedule(String eventId, List<SessionScheduleImportDataDTO> sessionsData) {
        List<Session> existingSessions = sessionRepository.findByEventId(eventId);
        Map<String, Session> sessionMap = existingSessions.stream()
                .collect(Collectors.toMap(Session::getId, Function.identity()));

        return processImport(sessionsData, (scheduleData, index) -> {
            validateSessionScheduleData(scheduleData);
            Session targetSession = findTargetSession(sessionMap, scheduleData);

            if (targetSession != null) {
                enrichExistingSessionWithScheduleData(targetSession, scheduleData);
                sessionRepository.save(targetSession);
            } else {
                Session newSession = createSessionFromScheduleData(scheduleData, eventId);
                sessionRepository.save(newSession);
                sessionMap.put(newSession.getId(), newSession);
            }
        });
    }

    private <T> ImportResultDTO processImport(List<T> data, BiConsumer<T, Integer> processor) {
        ImportResultDTO result = new ImportResultDTO();
        result.setTotalCount(data.size());
        result.setSuccessCount(0);
        result.setErrors(new ArrayList<>());

        for (int i = 0; i < data.size(); i++) {
            T item = data.get(i);
            try {
                processor.accept(item, i);
                result.setSuccessCount(result.getSuccessCount() + 1);
            } catch (Exception e) {
                String errorMessage = String.format("Item %d: %s", i + 1, e.getMessage());
                result.getErrors().add(errorMessage);
            }
        }
        return result;
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
        List<SessionReviewImportData> sessions = getSessionsReviewAsImportData(eventId);
        return extractUniqueSpeakers(sessions);
    }

    public List<SpeakerWithSessionsDTO> getSpeakersWithSessionsByEventId(String eventId) {
        List<SessionReviewImportData> sessions = getSessionsReviewAsImportData(eventId);
        return groupSessionsBySpeaker(sessions);
    }

    public Speaker getSpeakerById(String eventId, String speakerId) {
        List<SessionReviewImportData> sessions = getSessionsReviewAsImportData(eventId);
        return sessions.stream()
                .flatMap(session -> session.getSpeakers().stream())
                .filter(speaker -> speakerId.equals(speaker.getId()))
                .findFirst()
                .orElse(null);
    }

    private void validateSessionReviewData(SessionReviewImportDataDTO sessionData) {
        if (isBlank(sessionData.getId())) {
            throw new IllegalArgumentException("ID is required");
        }
    }

    private void validateSessionScheduleData(SessionScheduleImportDataDTO scheduleData) {
        List<String> errors = new ArrayList<>();

        if (isBlank(scheduleData.getId())) errors.add("ID is required");
        if (scheduleData.getStart() == null) errors.add("Start time is required");
        if (scheduleData.getEnd() == null) errors.add("End time is required");

        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(String.join(", ", errors));
        }
    }

    private SessionDTO convertImportDataToSessionDTO(SessionReviewImportDataDTO importData, String eventId) {
        SessionDTO sessionDTO = new SessionDTO();
        sessionDTO.setId(importData.getId());
        sessionDTO.setTitle(importData.getTitle());
        sessionDTO.setAbstractText(defaultIfBlank(importData.getAbstractText(), "Description à compléter"));
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

    private List<Speaker> extractUniqueSpeakers(List<SessionReviewImportData> sessions) {
        return sessions.stream()
                .flatMap(session -> session.getSpeakers().stream())
                .filter(speaker -> !isBlank(speaker.getName()))
                .collect(Collectors.toMap(
                        speaker -> speaker.getName().toLowerCase().trim(),
                        Function.identity(),
                        (existing, replacement) -> existing))
                .values()
                .stream()
                .sorted(Comparator.comparing(speaker -> speaker.getName().toLowerCase()))
                .collect(Collectors.toList());
    }

    private List<SpeakerWithSessionsDTO> groupSessionsBySpeaker(List<SessionReviewImportData> sessions) {
        Map<String, List<SessionReviewImportData>> sessionsBySpeaker = new HashMap<>();
        Map<String, Speaker> speakerMap = new HashMap<>();

        sessions.forEach(session -> {
            if (session.getSpeakers() != null) {
                session.getSpeakers().forEach(speaker -> {
                    if (speaker != null && !isBlank(speaker.getId())) {
                        speakerMap.put(speaker.getId(), speaker);
                        sessionsBySpeaker.computeIfAbsent(speaker.getId(), k -> new ArrayList<>()).add(session);
                    }
                });
            }
        });

        return speakerMap.entrySet().stream()
                .map(entry -> new SpeakerWithSessionsDTO(entry.getValue(), sessionsBySpeaker.get(entry.getKey())))
                .sorted(Comparator.comparing(dto -> dto.getSpeaker().getName().toLowerCase()))
                .collect(Collectors.toList());
    }

    private boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }

    private String defaultIfBlank(String str, String defaultValue) {
        return isBlank(str) ? defaultValue : str;
    }

    private <T> T defaultIfNull(T value, T defaultValue) {
        return value != null ? value : defaultValue;
    }

    private Session findTargetSession(Map<String, Session> sessionMap, SessionScheduleImportDataDTO scheduleData) {
        return Optional.ofNullable(sessionMap.get(scheduleData.getId()))
                .or(() -> Optional.ofNullable(scheduleData.getProposal())
                        .map(ProposalScheduleDTO::getId)
                        .map(sessionMap::get))
                .or(() -> findSessionByTitle(sessionMap, scheduleData.getTitle()))
                .orElse(null);
    }

    private Optional<Session> findSessionByTitle(Map<String, Session> sessionMap, String title) {
        if (isBlank(title)) return Optional.empty();

        return sessionMap.values().stream()
                .filter(session -> title.equals(session.getTitle()))
                .findFirst();
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
        if ((session.getAbstractText() == null ||
                session.getAbstractText().equals("Description à compléter"))
                && proposalData.getAbstractText() != null) {
            session.setAbstractText(proposalData.getAbstractText());
        }

        if ((session.getLevel() == null || session.getLevel().trim().isEmpty())
                && proposalData.getLevel() != null) {
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
            enrichSpeakersData(session, convertedSpeakers);
        }
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

    private void enrichSpeakersData(Session session, List<Speaker> proposalSpeakers) {
        if (session.getSpeakers() == null) {
            session.setSpeakers(new ArrayList<>());
        }

        Map<String, Speaker> existingSpeakersMap = session.getSpeakers().stream()
                .filter(speaker -> speaker.getId() != null)
                .collect(Collectors.toMap(Speaker::getId, Function.identity()));

        List<Speaker> enrichedSpeakers = new ArrayList<>();

        for (Speaker proposalSpeaker : proposalSpeakers) {
            if (proposalSpeaker.getId() != null && existingSpeakersMap.containsKey(proposalSpeaker.getId())) {
                Speaker existingSpeaker = existingSpeakersMap.get(proposalSpeaker.getId());
                Speaker mergedSpeaker = mergeSpeakerData(existingSpeaker, proposalSpeaker);
                enrichedSpeakers.add(mergedSpeaker);
                existingSpeakersMap.remove(proposalSpeaker.getId());
            } else {
                enrichedSpeakers.add(proposalSpeaker);
            }
        }

        enrichedSpeakers.addAll(existingSpeakersMap.values());
        session.setSpeakers(enrichedSpeakers);
    }

    private Speaker mergeSpeakerData(Speaker existing, Speaker fromSchedule) {
        Speaker merged = new Speaker();
        merged.setId(existing.getId());

        merged.setName(existing.getName() != null ? existing.getName() : fromSchedule.getName());
        merged.setBio(existing.getBio() != null ? existing.getBio() : fromSchedule.getBio());
        merged.setCompany(existing.getCompany() != null ? existing.getCompany() : fromSchedule.getCompany());
        merged.setPicture(existing.getPicture() != null ? existing.getPicture() : fromSchedule.getPicture());
        merged.setLocation(existing.getLocation());
        merged.setEmail(existing.getEmail());
        merged.setReferences(existing.getReferences());

        Set<String> mergedSocialLinks = new HashSet<>();
        if (existing.getSocialLinks() != null) {
            mergedSocialLinks.addAll(existing.getSocialLinks());
        }
        if (fromSchedule.getSocialLinks() != null) {
            mergedSocialLinks.addAll(fromSchedule.getSocialLinks());
        }
        merged.setSocialLinks(new ArrayList<>(mergedSocialLinks));

        return merged;
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
                session.setSpeakers(convertScheduleSpeakersToSpeakers(proposal.getSpeakers()));
            }
        }

        return session;
    }
}
