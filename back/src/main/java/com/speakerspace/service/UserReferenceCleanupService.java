package com.speakerspace.service;

import com.speakerspace.model.User;
import com.speakerspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserReferenceCleanupService {

    private final UserRepository userRepository;

    public void removeEventIdFromAllUsers(String eventId) {
        try {
            List<User> usersWithEvent = userRepository.findUsersByEventId(eventId);

            for (User user : usersWithEvent) {
                if (removeEventIdFromUser(user, eventId)) {
                    user.setUpdatedAt(new Date());
                    userRepository.saveUser(user);
                    log.debug("Removed eventId {} from user {}", eventId, user.getUid());
                }
            }

        } catch (Exception e) {
            log.error("Failed to cleanup eventId {} from users: {}", eventId, e.getMessage(), e);
        }
    }

    public void removeSessionIdFromAllUsers(String sessionId) {
        try {
            List<User> usersWithSession = userRepository.findUsersBySessionId(sessionId);

            for (User user : usersWithSession) {
                if (removeSessionIdFromUser(user, sessionId)) {
                    user.setUpdatedAt(new Date());
                    userRepository.saveUser(user);
                    log.debug("Removed sessionId {} from user {}", sessionId, user.getUid());
                }
            }

        } catch (Exception e) {
            log.error("Failed to cleanup sessionId {} from users: {}", sessionId, e.getMessage(), e);
        }
    }

    public void removeSpeakerIdFromAllUsers(String speakerId) {
        try {
            log.debug("Starting cleanup of speakerId: {}", speakerId);

            List<User> usersWithSpeaker = userRepository.findUsersBySpeakerId(speakerId);
            log.debug("Found {} users with speakerId: {}", usersWithSpeaker.size(), speakerId);

            for (User user : usersWithSpeaker) {
                log.debug("User {} has speakerIds: {}", user.getUid(), user.getSpeakerIds());

                if (removeSpeakerIdFromUser(user, speakerId)) {
                    user.setUpdatedAt(new Date());
                    userRepository.saveUser(user);
                } else {
                    log.warn("Failed to remove speakerId {} from user {} - not found in list",
                            speakerId, user.getUid());
                }
            }

        } catch (Exception e) {
            log.error("Failed to cleanup speakerId {} from users: {}", speakerId, e.getMessage(), e);
        }
    }

    private boolean removeSpeakerIdFromUser(User user, String speakerId) {
        if (user.getSpeakerIds() == null) {
            log.debug("User {} has null speakerIds", user.getUid());
            return false;
        }

        if (!user.getSpeakerIds().contains(speakerId)) {
            log.debug("User {} does not contain speakerId {}, current list: {}",
                    user.getUid(), speakerId, user.getSpeakerIds());
            return false;
        }

        List<String> updatedSpeakerIds = new ArrayList<>(user.getSpeakerIds());
        boolean removed = updatedSpeakerIds.remove(speakerId);
        user.setSpeakerIds(updatedSpeakerIds);

        log.debug("Removed speakerId {} from user {}, new list: {}",
                speakerId, user.getUid(), updatedSpeakerIds);

        return removed;
    }

    private boolean removeEventIdFromUser(User user, String eventId) {
        if (user.getEventIds() == null || !user.getEventIds().contains(eventId)) {
            return false;
        }

        List<String> updatedEventIds = new ArrayList<>(user.getEventIds());
        boolean removed = updatedEventIds.remove(eventId);
        user.setEventIds(updatedEventIds);
        return removed;
    }

    private boolean removeSessionIdFromUser(User user, String sessionId) {
        if (user.getSessionIds() == null || !user.getSessionIds().contains(sessionId)) {
            return false;
        }

        List<String> updatedSessionIds = new ArrayList<>(user.getSessionIds());
        boolean removed = updatedSessionIds.remove(sessionId);
        user.setSessionIds(updatedSessionIds);
        return removed;
    }
}
