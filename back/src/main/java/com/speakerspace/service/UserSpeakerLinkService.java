package com.speakerspace.service;

import com.speakerspace.exception.EntityNotFoundException;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.mapper.session.SessionImportMapper;
import com.speakerspace.mapper.session.SpeakerMapper;
import com.speakerspace.model.User;
import com.speakerspace.model.session.Session;
import com.speakerspace.model.session.SessionImportData;
import com.speakerspace.model.session.Speaker;
import com.speakerspace.dto.UserSpeakerProfileDTO;
import com.speakerspace.repository.SessionRepository;
import com.speakerspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSpeakerLinkService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final UserMapper userMapper;
    private final SpeakerMapper speakerMapper;
    private final SessionImportMapper sessionImportMapper;

    public void linkSpeakerToUserOnImport(Speaker speaker, String eventId, String sessionId) {
        if (!isValidSpeakerEmail(speaker)) {
            log.debug("Speaker {} has invalid email, skipping user linking", speaker.getId());
            return;
        }

        String normalizedEmail = normalizeEmail(speaker.getEmail());
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (updateUserWithSpeakerLinks(user, speaker, eventId, sessionId)) {
                try {
                    userRepository.saveUser(user);
                    log.info("Linked speaker {} to existing user {} for event {}",
                            speaker.getId(), user.getUid(), eventId);
                } catch (Exception e) {
                    log.error("Failed to save user {} after linking speaker {}: {}",
                            user.getUid(), speaker.getId(), e.getMessage());
                }
            }
        } else {
            log.debug("No existing user found for speaker email: {}", normalizedEmail);
        }
    }

    @Async
    public CompletableFuture<Void> linkExistingSpeakersToNewUser(String userUid, String email) {
        return CompletableFuture.runAsync(() -> {
            try {
                if (!isValidEmail(email)) {
                    log.warn("Invalid email for user linking: {}", email);
                    return;
                }

                String normalizedEmail = normalizeEmail(email);
                SpeakerUserLinkResult linkResult = findAllSpeakerLinksForEmail(normalizedEmail);

                if (linkResult.hasLinks()) {
                    updateUserWithAllLinks(userUid, linkResult);
                } else {
                    log.debug("No existing speakers found for user {} with email {}", userUid, normalizedEmail);
                }
            } catch (Exception e) {
                log.error("Failed to link existing speakers to user {}: {}", userUid, e.getMessage(), e);
            }
        });
    }

    private SpeakerUserLinkResult findAllSpeakerLinksForEmail(String normalizedEmail) {
        SpeakerUserLinkResult result = new SpeakerUserLinkResult();

        try {
            List<Session> allSessions = sessionRepository.findAll();

            for (Session session : allSessions) {
                List<Speaker> speakers = session.getSpeakers();
                if (speakers == null || speakers.isEmpty()) {
                    continue;
                }

                for (Speaker speaker : speakers) {
                    if (isMatchingEmail(normalizedEmail, speaker.getEmail())) {
                        result.addLink(speaker.getId(), session.getEventId(), session.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error finding speaker links for email {}: {}", normalizedEmail, e.getMessage());
        }

        return result;
    }

    private void updateUserWithAllLinks(String userUid, SpeakerUserLinkResult linkResult) {
        try {
            User user = userRepository.findUserById(userUid);
            if (user == null) {
                log.warn("User not found for linking: {}", userUid);
                return;
            }

            user.setSpeakerIds(mergeUniqueIds(user.getSpeakerIds(), linkResult.getSpeakerIds()));
            user.setEventIds(mergeUniqueIds(user.getEventIds(), linkResult.getEventIds()));
            user.setSessionIds(mergeUniqueIds(user.getSessionIds(), linkResult.getSessionIds()));
            user.setUpdatedAt(new Date());

            userRepository.saveUser(user);
        } catch (Exception e) {
            log.error("Failed to update user {} with speaker links: {}", userUid, e.getMessage());
        }
    }

    public void updateUserSessionLinks(String eventId) {
        try {
            List<Session> sessions = sessionRepository.findByEventId(eventId);
            Map<String, Set<String>> userSessionMap = new HashMap<>();

            for (Session session : sessions) {
                List<Speaker> speakers = session.getSpeakers();
                if (speakers == null || speakers.isEmpty()) {
                    continue;
                }

                for (Speaker speaker : speakers) {
                    if (isValidSpeakerEmail(speaker)) {
                        String normalizedEmail = normalizeEmail(speaker.getEmail());
                        userSessionMap.computeIfAbsent(normalizedEmail, k -> new HashSet<>())
                                .add(session.getId());
                    }
                }
            }

            userSessionMap.forEach(this::updateUserSessionsForEmail);

        } catch (Exception e) {
            log.error("Failed to update user session links for event {}: {}", eventId, e.getMessage());
        }
    }

    private void updateUserSessionsForEmail(String email, Set<String> sessionIds) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                List<String> currentSessionIds = user.getSessionIds() != null ?
                        new ArrayList<>(user.getSessionIds()) : new ArrayList<>();

                boolean updated = false;
                for (String sessionId : sessionIds) {
                    if (!currentSessionIds.contains(sessionId)) {
                        currentSessionIds.add(sessionId);
                        updated = true;
                    }
                }

                if (updated) {
                    user.setSessionIds(currentSessionIds);
                    user.setUpdatedAt(new Date());
                    userRepository.saveUser(user);
                    log.info("Updated session links for user {} with {} sessions",
                            user.getUid(), sessionIds.size());
                }
            }
        } catch (Exception e) {
            log.error("Failed to update sessions for user with email {}: {}", email, e.getMessage());
        }
    }

    private boolean isValidSpeakerEmail(Speaker speaker) {
        return speaker != null && isValidEmail(speaker.getEmail());
    }

    private boolean isValidEmail(String email) {
        return email != null && !email.trim().isEmpty() && email.contains("@");
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase().trim();
    }

    private boolean isMatchingEmail(String normalizedEmail, String speakerEmail) {
        return isValidEmail(speakerEmail) && normalizedEmail.equals(normalizeEmail(speakerEmail));
    }

    private boolean updateUserWithSpeakerLinks(User user, Speaker speaker, String eventId, String sessionId) {
        boolean updated = false;

        updated |= addToListIfNotExists(user.getSpeakerIds(), speaker.getId(), user::setSpeakerIds);
        updated |= addToListIfNotExists(user.getEventIds(), eventId, user::setEventIds);
        updated |= addToListIfNotExists(user.getSessionIds(), sessionId, user::setSessionIds);

        if (updated) {
            user.setUpdatedAt(new Date());
        }

        return updated;
    }

    private boolean addToListIfNotExists(List<String> list, String item, Consumer<List<String>> setter) {
        if (list == null) {
            setter.accept(new ArrayList<>(List.of(item)));
            return true;
        }

        if (!list.contains(item)) {
            List<String> newList = new ArrayList<>(list);
            newList.add(item);
            setter.accept(newList);
            return true;
        }

        return false;
    }

    private List<String> mergeUniqueIds(List<String> existing, Set<String> newIds) {
        Set<String> merged = new LinkedHashSet<>();
        if (existing != null) {
            merged.addAll(existing);
        }
        merged.addAll(newIds);
        return new ArrayList<>(merged);
    }

    public void syncSpeakerDataToUser(String userUid, String eventId) {
        try {
            User user = userRepository.findUserById(userUid);
            if (user == null) {
                throw new EntityNotFoundException("User not found: " + userUid);
            }

            if (!isValidEmail(user.getEmail())) {
                log.warn("Cannot sync speaker data - user {} has invalid email", userUid);
                return;
            }

            List<Speaker> matchingSpeakers = findSpeakersByEmailAndEvent(user.getEmail(), eventId);

            boolean profileUpdated = false;
            for (Speaker speaker : matchingSpeakers) {
                if (updateUserProfileFromSpeaker(user, speaker)) {
                    profileUpdated = true;
                }
            }

            if (profileUpdated) {
                user.setUpdatedAt(new Date());
                userRepository.saveUser(user);
                log.info("Synchronized speaker profile data to user {} for event {}", userUid, eventId);
            }
        } catch (Exception e) {
            log.error("Failed to sync speaker data for user {} and event {}: {}", userUid, eventId, e.getMessage());
            throw e;
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
                        isMatchingEmail(normalizeEmail(user.getEmail()), speaker.getEmail()))
                .collect(Collectors.toList());

        List<SessionImportData> sessions = getUserSessionsForEvent(user, eventId);

        return UserSpeakerProfileDTO.builder()
                .user(userMapper.convertToDTO(user))
                .speakers(speakers.stream().map(speakerMapper::convertToDTO).collect(Collectors.toList()))
                .sessions(sessions)
                .eventId(eventId)
                .build();
    }

    public List<String> getUserSpeakerEventIds(String userUid) {
        User user = userRepository.findUserById(userUid);
        return user != null && user.getEventIds() != null ?
                new ArrayList<>(user.getEventIds()) : new ArrayList<>();
    }

    private boolean updateUserProfileFromSpeaker(User user, Speaker speaker) {
        boolean updated = false;

        updated |= updateFieldIfEmpty(user.getName(), speaker.getName(), user::setName);
        updated |= updateFieldIfEmpty(user.getBio(), speaker.getBio(), user::setBio);
        updated |= updateFieldIfEmpty(user.getCompany(), speaker.getCompany(), user::setCompany);
        updated |= updateFieldIfEmpty(user.getLocation(), speaker.getLocation(), user::setLocation);
        updated |= updateFieldIfEmpty(user.getPhotoURL(), speaker.getPicture(), user::setPhotoURL);

        if (speaker.getSocialLinks() != null && !speaker.getSocialLinks().isEmpty()) {
            List<String> mergedLinks = mergeSocialLinks(user.getSocialLinks(), speaker.getSocialLinks());
            if (!Objects.equals(user.getSocialLinks(), mergedLinks)) {
                user.setSocialLinks(mergedLinks);
                updated = true;
            }
        }

        return updated;
    }

    private boolean updateFieldIfEmpty(String currentValue, String newValue, Consumer<String> setter) {
        if (isEmptyOrNull(currentValue) && !isEmptyOrNull(newValue)) {
            setter.accept(newValue.trim());
            return true;
        }
        return false;
    }

    private boolean isEmptyOrNull(String value) {
        return value == null || value.trim().isEmpty();
    }

    private List<String> mergeSocialLinks(List<String> userLinks, List<String> speakerLinks) {
        Set<String> merged = new LinkedHashSet<>();
        if (userLinks != null) merged.addAll(userLinks);
        if (speakerLinks != null) merged.addAll(speakerLinks);
        return new ArrayList<>(merged);
    }

    private List<Speaker> findSpeakersByEmailAndEvent(String email, String eventId) {
        return sessionRepository.findByEventId(eventId)
                .stream()
                .filter(session -> session.getSpeakers() != null)
                .flatMap(session -> session.getSpeakers().stream())
                .filter(speaker -> isMatchingEmail(normalizeEmail(email), speaker.getEmail()))
                .distinct()
                .collect(Collectors.toList());
    }

    private List<SessionImportData> getUserSessionsForEvent(User user, String eventId) {
        if (user.getSessionIds() == null) {
            return new ArrayList<>();
        }

        return sessionRepository.findByEventId(eventId)
                .stream()
                .filter(session -> user.getSessionIds().contains(session.getId()))
                .map(sessionImportMapper::convertSessionToImportData)
                .collect(Collectors.toList());
    }

    private static class SpeakerUserLinkResult {
        private final Set<String> speakerIds = new HashSet<>();
        private final Set<String> eventIds = new HashSet<>();
        private final Set<String> sessionIds = new HashSet<>();

        public void addLink(String speakerId, String eventId, String sessionId) {
            speakerIds.add(speakerId);
            eventIds.add(eventId);
            sessionIds.add(sessionId);
        }

        public boolean hasLinks() {
            return !speakerIds.isEmpty();
        }

        public Set<String> getSpeakerIds() { return speakerIds; }
        public Set<String> getEventIds() { return eventIds; }
        public Set<String> getSessionIds() { return sessionIds; }
    }
}

