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
                if (user.getCompany() == null && existingUser.getCompany() != null) {
                    user.setCompany(existingUser.getCompany());
                }
                if (user.getCity() == null && existingUser.getCity() != null) {
                    user.setCity(existingUser.getCity());
                }
                if (user.getPhoneNumber() == null && existingUser.getPhoneNumber() != null) {
                    user.setPhoneNumber(existingUser.getPhoneNumber());
                }
                if (user.getGithubLink() == null && existingUser.getGithubLink() != null) {
                    user.setGithubLink(existingUser.getGithubLink());
                }
                if (user.getTwitterLink() == null && existingUser.getTwitterLink() != null) {
                    user.setTwitterLink(existingUser.getTwitterLink());
                }
                if (user.getBlueSkyLink() == null && existingUser.getBlueSkyLink() != null) {
                    user.setBlueSkyLink(existingUser.getBlueSkyLink());
                }
                if (user.getLinkedInLink() == null && existingUser.getLinkedInLink() != null) {
                    user.setLinkedInLink(existingUser.getLinkedInLink());
                }
//TODO: les autres après
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

    public User updateUser(User updatedUser) {
        try {
            User existingUser = getUserByUid(updatedUser.getUid());
            if (existingUser == null) {
                return null;
            }

            boolean updated = false;

            if (updatedUser.getDisplayName() != null) {
                existingUser.setDisplayName(updatedUser.getDisplayName());
                updated = true;
            }

            if (updatedUser.getPhotoURL() != null) {
                existingUser.setPhotoURL(updatedUser.getPhotoURL());
                updated = true;
            }

            if (updatedUser.getCompany() != null) {
                existingUser.setCompany(updatedUser.getCompany());
                updated = true;
            }

            if (updatedUser.getCity() != null) {
                existingUser.setCity(updatedUser.getCity());
                updated = true;
            }

            if (updatedUser.getPhoneNumber() != null) {
                existingUser.setPhoneNumber(updatedUser.getPhoneNumber());
                updated = true;
            }

            if (updatedUser.getGithubLink() != null) {
                existingUser.setGithubLink(updatedUser.getGithubLink());
                updated = true;
            }

            if (updatedUser.getTwitterLink() != null) {
                existingUser.setTwitterLink(updatedUser.getTwitterLink());
                updated = true;
            }

            if (updatedUser.getBlueSkyLink() != null) {
                existingUser.setBlueSkyLink(updatedUser.getBlueSkyLink());
                updated = true;
            }

            if (updatedUser.getLinkedInLink() != null) {
                existingUser.setLinkedInLink(updatedUser.getLinkedInLink());
                updated = true;
            }
//TODO : les autres après
            if (!updated) {
                return existingUser;
            }

            Firestore firestore = FirestoreClient.getFirestore();
            firestore.collection(COLLECTION_NAME).document(existingUser.getUid()).set(existingUser).get();

            return existingUser;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }
}
