package com.speakerspace.service;

import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.model.User;
import com.speakerspace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final String COLLECTION_NAME = "users";

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    @Autowired
    public UserService(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    public UserDTO saveUser(UserDTO userDTO) {
        try {
            logger.info("Saving user to Firestore: {}", userDTO.getUid());

            User userToSave = userMapper.convertToEntity(userDTO);

            Firestore firestore = FirestoreClient.getFirestore();
            CollectionReference usersCollection = firestore.collection(COLLECTION_NAME);

            User existingUser = getUserEntityByUid(userDTO.getUid());

            if (existingUser != null) {
                logger.info("User already exists, updating: {}", userDTO.getUid());

                userToSave = preserveExistingFields(userToSave, existingUser);
            } else {
                logger.info("Creating new user: {}", userDTO.getUid());
            }

            usersCollection.document(userToSave.getUid()).set(userToSave).get();

            return userMapper.convertToDTO(userToSave);
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error saving user to Firestore", e);
            throw new RuntimeException("Failed to save user", e);
        }
    }

    private User preserveExistingFields(User newUser, User existingUser) {
        if (newUser.getCompany() == null) newUser.setCompany(existingUser.getCompany());
        if (newUser.getCity() == null) newUser.setCity(existingUser.getCity());
        if (newUser.getPhoneNumber() == null) newUser.setPhoneNumber(existingUser.getPhoneNumber());
        if (newUser.getGithubLink() == null) newUser.setGithubLink(existingUser.getGithubLink());
        if (newUser.getTwitterLink() == null) newUser.setTwitterLink(existingUser.getTwitterLink());
        if (newUser.getBlueSkyLink() == null) newUser.setBlueSkyLink(existingUser.getBlueSkyLink());
        if (newUser.getLinkedInLink() == null) newUser.setLinkedInLink(existingUser.getLinkedInLink());
        if (newUser.getBiography() == null) newUser.setBiography(existingUser.getBiography());
        if (newUser.getOtherLink() == null) newUser.setOtherLink(existingUser.getOtherLink());

        return newUser;
    }

    public UserDTO getUserByUid(String uid) {
        User user = getUserEntityByUid(uid);
        if (user == null) {
            return null;
        }
        return userMapper.convertToDTO(user);
    }

    private User getUserEntityByUid(String uid) {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                    .document(uid)
                    .get()
                    .get();

            if (!document.exists()) {
                return null;
            }

            return document.toObject(User.class);
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching user from Firestore", e);
            return null;
        }
    }

    public UserDTO updateUser(UserDTO userDTO) {
        try {
            User existingUser = getUserEntityByUid(userDTO.getUid());
            if (existingUser == null) {
                return null;
            }

            User updatedUser = userMapper.updateEntityFromDTO(userDTO, existingUser);

            Firestore firestore = FirestoreClient.getFirestore();
            firestore.collection(COLLECTION_NAME)
                    .document(updatedUser.getUid())
                    .set(updatedUser)
                    .get();

            return userMapper.convertToDTO(updatedUser);
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Failed to update user", e);
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())) {
            String userId = authentication.getName();
            return userId;
        }
        logger.warn("No authenticated user found");
        throw new IllegalStateException("No authenticated user found");
    }
}