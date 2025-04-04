package com.speakerspace.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.speakerspace.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private static final Logger logger = LoggerFactory.getLogger(UserRepositoryImpl.class);
    private static final String COLLECTION_NAME = "users";

    private final Firestore firestore;

    public UserRepositoryImpl(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Optional<User> findById(String uid) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(uid);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();

            if (document.exists()) {
                User user = document.toObject(User.class);
                return Optional.ofNullable(user);
            } else {
                return Optional.empty();
            }
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding user by ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find user", e);
        }
    }
}
