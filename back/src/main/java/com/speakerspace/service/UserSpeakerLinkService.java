package com.speakerspace.service;

import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.User;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.model.session.UserSpeakerProfileDTO;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.SessionRepositoryImpl;
import com.speakerspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSpeakerLinkService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final UserMapper userMapper;
    private final SpeakerMapper speakerMapper;

    public void linkSpeakerToUser(Speaker speaker, String eventId) {
        if (speaker.getEmail() == null || speaker.getEmail().trim().isEmpty()) {
            log.warn("Cannot link speaker {} - no email provided", speaker.getId());
            return;
        }

        String normalizedEmail = speaker.getEmail().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            updateUserWithSpeakerInfo(user, speaker, eventId);
            userRepository.saveUser(user);

            log.info("Successfully linked speaker {} to user {} for event {}",
                    speaker.getId(), user.getUid(), eventId);
        } else {
            log.debug("No user found with email {} for speaker {}",
                    normalizedEmail, speaker.getId());
        }
    }

    private boolean updateUserWithSpeakerInfo(User user, Speaker speaker, String eventId) {
        boolean updated = false;

        if (shouldUpdateField(user.getName(), speaker.getName())) {
            user.setName(speaker.getName());
            updated = true;
        }

        if (shouldUpdateField(user.getBio(), speaker.getBio())) {
            user.setBio(speaker.getBio());
            updated = true;
        }

        if (shouldUpdateField(user.getCompany(), speaker.getCompany())) {
            user.setCompany(speaker.getCompany());
            updated = true;
        }

        if (shouldUpdateField(user.getLocation(), speaker.getLocation())) {
            user.setLocation(speaker.getLocation());
            updated = true;
        }

        if (shouldUpdateField(user.getPhotoURL(), speaker.getPicture())) {
            user.setPhotoURL(speaker.getPicture());
            updated = true;
        }

        if (speaker.getSocialLinks() != null && !speaker.getSocialLinks().isEmpty()) {
            List<String> mergedSocialLinks = mergeSocialLinks(user.getSocialLinks(), speaker.getSocialLinks());
            if (!Objects.equals(user.getSocialLinks(), mergedSocialLinks)) {
                user.setSocialLinks(mergedSocialLinks);
                updated = true;
            }
        }

        addSpeakerIdToUser(user, speaker.getId());
        addEventIdToUser(user, eventId);

        if (updated) {
            user.setUpdatedAt(new Date());
        }

        return updated;
    }

    public void updateUserSessionLinks(String eventId) {
        List<Session> sessions = sessionRepository.findByEventId(eventId);
        Map<String, Set<String>> userSessionMap = new HashMap<>();

        for (Session session : sessions) {
            if (session.getSpeakers() != null) {
                for (Speaker speaker : session.getSpeakers()) {
                    if (speaker.getEmail() != null) {
                        String normalizedEmail = speaker.getEmail().toLowerCase().trim();
                        userSessionMap.computeIfAbsent(normalizedEmail, k -> new HashSet<>())
                                .add(session.getId());
                    }
                }
            }
        }

        for (Map.Entry<String, Set<String>> entry : userSessionMap.entrySet()) {
            Optional<User> userOpt = userRepository.findByEmail(entry.getKey());
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                List<String> currentSessionIds = user.getSessionIds() != null ?
                        new ArrayList<>(user.getSessionIds()) : new ArrayList<>();

                boolean updated = false;
                for (String sessionId : entry.getValue()) {
                    if (!currentSessionIds.contains(sessionId)) {
                        currentSessionIds.add(sessionId);
                        updated = true;
                    }
                }

                if (updated) {
                    user.setSessionIds(currentSessionIds);
                    user.setUpdatedAt(new Date());
                    userRepository.saveUser(user);

                    log.info("Updated session links for user {} in event {}",
                            user.getUid(), eventId);
                }
            }
        }
    }

    public UserSpeakerProfileDTO getUserSpeakerProfile(String userUid, String eventId) {
        User user = userRepository.findUserById(userUid);
        if (user == null) {
            throw new EntityNotFoundException("User not found: " + userUid);
        }

        List<Speaker> speakers = sessionRepository.findUniqueSpeekersByEventId(eventId)
                .stream()
                .filter(speaker -> user.getEmail() != null &&
                        user.getEmail().equalsIgnoreCase(speaker.getEmail()))
                .collect(Collectors.toList());

        List<SessionImportData> sessions = new ArrayList<>();
        if (user.getSessionIds() != null) {
            sessions = sessionRepository.findByEventId(eventId)
                    .stream()
                    .filter(session -> user.getSessionIds().contains(session.getId()))
                    .map(session -> {
                        SessionImportData importData = new SessionImportData();
                        importData.setId(session.getId());
                        importData.setTitle(session.getTitle());
                        importData.setAbstractText(session.getAbstractText());
                        importData.setStart(session.getStart());
                        importData.setEnd(session.getEnd());
                        importData.setTrack(session.getTrack());
                        importData.setLevel(session.getLevel());
                        importData.setSpeakers(session.getSpeakers());
                        return importData;
                    })
                    .collect(Collectors.toList());
        }

        return UserSpeakerProfileDTO.builder()
                .user(userMapper.convertToDTO(user))
                .speakers(speakers.stream().map(speakerMapper::convertToDTO).collect(Collectors.toList()))
                .sessions(sessions)
                .eventId(eventId)
                .build();
    }

    private boolean shouldUpdateField(String currentValue, String newValue) {
        return (currentValue == null || currentValue.trim().isEmpty()) &&
                (newValue != null && !newValue.trim().isEmpty());
    }

    private List<String> mergeSocialLinks(List<String> userLinks, List<String> speakerLinks) {
        Set<String> mergedLinks = new LinkedHashSet<>();

        if (userLinks != null) {
            mergedLinks.addAll(userLinks);
        }

        if (speakerLinks != null) {
            mergedLinks.addAll(speakerLinks);
        }

        return new ArrayList<>(mergedLinks);
    }

    private void addSpeakerIdToUser(User user, String speakerId) {
        if (user.getSpeakerIds() == null) {
            user.setSpeakerIds(new ArrayList<>());
        }

        if (!user.getSpeakerIds().contains(speakerId)) {
            user.getSpeakerIds().add(speakerId);
        }
    }

    private void addEventIdToUser(User user, String eventId) {
        if (user.getEventIds() == null) {
            user.setEventIds(new ArrayList<>());
        }

        if (!user.getEventIds().contains(eventId)) {
            user.getEventIds().add(eventId);
        }
    }

    public void linkExistingSpeakersToUser(String userUid, String email) {
        if (email == null || email.trim().isEmpty()) {
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();

        List<Session> sessionsWithSpeakers = ((SessionRepositoryImpl) sessionRepository).findAllWithSpeakers();

        Set<String> linkedEventIds = new HashSet<>();
        Set<String> linkedSpeakerIds = new HashSet<>();
        Set<String> linkedSessionIds = new HashSet<>();

        for (Session session : sessionsWithSpeakers) {
            for (Speaker speaker : session.getSpeakers()) {
                if (normalizedEmail.equals(speaker.getEmail())) {
                    linkedEventIds.add(session.getEventId());
                    linkedSpeakerIds.add(speaker.getId());
                    linkedSessionIds.add(session.getId());

                    log.debug("Found existing speaker {} for user {} in event {}",
                            speaker.getId(), userUid, session.getEventId());
                }
            }
        }

        if (!linkedSpeakerIds.isEmpty()) {
            updateUserWithLinks(userUid, linkedSpeakerIds, linkedEventIds, linkedSessionIds);

            log.info("Successfully linked {} speakers, {} events, {} sessions to user {}",
                    linkedSpeakerIds.size(), linkedEventIds.size(), linkedSessionIds.size(), userUid);
        } else {
            log.debug("No existing speakers found for user {} with email {}", userUid, normalizedEmail);
        }
    }

    public void syncSpeakerDataToUser(String userUid, String eventId) {
        User user = userRepository.findUserById(userUid);
        if (user == null) {
            throw new EntityNotFoundException("User not found: " + userUid);
        }

        if (user.getEmail() == null) {
            log.warn("Cannot sync speaker data - user {} has no email", userUid);
            return;
        }

        List<Speaker> speakers = sessionRepository.findUniqueSpeekersByEventId(eventId)
                .stream()
                .filter(speaker -> user.getEmail().equalsIgnoreCase(speaker.getEmail()))
                .collect(Collectors.toList());

        boolean updated = false;
        for (Speaker speaker : speakers) {
            if (updateUserWithSpeakerInfo(user, speaker, eventId)) {
                updated = true;
            }
        }

        if (updated) {
            userRepository.saveUser(user);
            log.info("Synchronized speaker data to user {} for event {}", userUid, eventId);
        }
    }

    public List<String> getUserSpeakerEventIds(String userUid) {
        User user = userRepository.findUserById(userUid);
        if (user == null) {
            return new ArrayList<>();
        }

        return user.getEventIds() != null ? new ArrayList<>(user.getEventIds()) : new ArrayList<>();
    }

    private void updateUserWithLinks(String userUid, Set<String> speakerIds,
                                     Set<String> eventIds, Set<String> sessionIds) {
        User user = userRepository.findUserById(userUid);
        if (user != null) {
            user.setSpeakerIds(new ArrayList<>(speakerIds));
            user.setEventIds(new ArrayList<>(eventIds));
            user.setSessionIds(new ArrayList<>(sessionIds));
            user.setUpdatedAt(new Date());

            userRepository.saveUser(user);
        }
    }
}
