package com.speakerspace.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.speakerspace.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final String COLLECTION_NAME = "users";

    public User saveUser(User user) {
        try {
            logger.info("Saving user to Firestore: {}", user.getUid());
            Firestore firestore = FirestoreClient.getFirestore();
            CollectionReference usersCollection = firestore.collection(COLLECTION_NAME);

            User existingUser = getUserByUid(user.getUid());
            if (existingUser != null) {
                logger.info("User already exists, updating: {}", user.getUid());
            } else {
                logger.info("Creating new user: {}", user.getUid());
            }

            usersCollection.document(user.getUid()).set(user).get();

            return user;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error saving user to Firestore", e);
            throw new RuntimeException("Failed to save user", e);
        }
    }

    public User getUserByUid(String uid) {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            User user = firestore.collection(COLLECTION_NAME).document(uid)
                    .get().get().toObject(User.class);
            return user;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching user from Firestore", e);
            return null;
        }
    }
}
