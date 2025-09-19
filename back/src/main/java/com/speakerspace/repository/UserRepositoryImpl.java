package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.User;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Repository
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
}
