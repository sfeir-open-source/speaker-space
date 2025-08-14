package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Repository
@Slf4j
public class UserRepositoryImpl extends AbstractFirestoreRepository<User, String>
        implements UserRepository {

    public UserRepositoryImpl(Firestore firestore) {
        super(firestore, User.class, "users");
    }

    @Override
    protected DocumentReference getDocumentReference(User user) {
        if (user.getUid() == null || user.getUid().isEmpty()) {
            throw new IllegalArgumentException("User UID cannot be null or empty");
        }
        return getCollection().document(user.getUid());
    }

    @Override
    public User saveUser(User user) {
        return saveSync(user);
    }

    @Override
    public User findUserById(String uid) {
        return findByIdSync(uid).orElse(null);
    }

    @Override
    public Optional<User> findUserByIdOptional(String uid) {
        return findByIdSync(uid);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return executeQuerySingle(getCollection().whereEqualTo("email", email.toLowerCase()));
    }

    @Override
    public List<User> searchUsersByEmail(String emailQuery, int limit) {
        String normalizedQuery = emailQuery.toLowerCase();
        try {
            return getCollection()
                    .whereGreaterThanOrEqualTo("email", normalizedQuery)
                    .whereLessThanOrEqualTo("email", normalizedQuery + "\uf8ff")
                    .limit(limit)
                    .get().get().getDocuments().stream()
                    .map(doc -> {
                        User user = doc.toObject(User.class);
                        user.setUid(doc.getId());
                        return user;
                    })
                    .toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to search users by email", e);
        }
    }

    @Override
    public List<User> findUsersByEventId(String eventId) {
        try {
            return getCollection()
                    .whereArrayContains("eventIds", eventId)
                    .get()
                    .get()
                    .getDocuments()
                    .stream()
                    .map(doc -> {
                        User user = doc.toObject(User.class);
                        user.setUid(doc.getId());
                        return user;
                    })
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            log.error("Failed to find users by eventId: {}", eventId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<User> findUsersBySessionId(String sessionId) {
        try {
            return getCollection()
                    .whereArrayContains("sessionIds", sessionId)
                    .get()
                    .get()
                    .getDocuments()
                    .stream()
                    .map(doc -> {
                        User user = doc.toObject(User.class);
                        user.setUid(doc.getId());
                        return user;
                    })
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            log.error("Failed to find users by sessionId: {}", sessionId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<User> findUsersBySpeakerId(String speakerId) {
        try {
            log.debug("Searching users with speakerId: {}", speakerId);

            List<User> users = getCollection()
                    .whereArrayContains("speakerIds", speakerId)
                    .get()
                    .get()
                    .getDocuments()
                    .stream()
                    .map(doc -> {
                        User user = doc.toObject(User.class);
                        user.setUid(doc.getId());
                        return user;
                    })
                    .collect(Collectors.toList());

            log.debug("Found {} users with speakerId: {}", users.size(), speakerId);
            return users;
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            log.error("Failed to find users by speakerId: {}", speakerId, e);
            return new ArrayList<>();
        }
    }
}
