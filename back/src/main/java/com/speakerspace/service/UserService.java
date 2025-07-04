package com.speakerspace.service;

import com.google.cloud.firestore.*;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.exception.ValidationException;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.model.Team;
import com.speakerspace.model.User;
import com.speakerspace.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final String COLLECTION_NAME = "users";

    private final UserMapper userMapper;
    private final Firestore firestore;
    private final TeamRepository teamRepository;

    public UserDTO saveUser(UserDTO userDTO) {
        User user = userMapper.convertToEntity(userDTO);
        validateRequiredFields(user);

        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(user.getUid());
            DocumentSnapshot existingDoc = docRef.get().get();

            if (existingDoc.exists()) {
                User existingUser = existingDoc.toObject(User.class);
                if (existingUser != null) {
                    user = preserveExistingFields(user, existingUser);
                }
            }

            docRef.set(user).get();
            return userMapper.convertToDTO(user);
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Failed to save user", e);
            throw new RuntimeException("Failed to save user to Firestore", e);
        }
    }

    public UserDTO getUserByUid(String uid) {
        User user = getUserEntityByUid(uid);
        return user != null ? userMapper.convertToDTO(user) : null;
    }

    private User getUserEntityByUid(String uid) {
        try {
            DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                    .document(uid)
                    .get()
                    .get();

            return document.exists() ? document.toObject(User.class) : null;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error fetching user by UID", e);
            return null;
        }
    }

    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())) {
            return authentication.getName();
        }
        throw new IllegalStateException("No authenticated user found");
    }

    public UserDTO getUserByEmail(String email) {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("email", email)
                    .get().get().getDocuments();

            if (documents.isEmpty()) {
                return null;
            }

            User user = documents.get(0).toObject(User.class);
            return userMapper.convertToDTO(user);
        } catch (Exception e) {
            logger.error("Error getting user by email", e);
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
            validateFullUser(updatedUser);

            firestore.collection(COLLECTION_NAME)
                    .document(updatedUser.getUid())
                    .set(updatedUser)
                    .get();

            return userMapper.convertToDTO(updatedUser);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    private User preserveExistingFields(User newUser, User existingUser) {
        if (existingUser.getDisplayName() != null && !existingUser.getDisplayName().isEmpty()) {
            newUser.setDisplayName(existingUser.getDisplayName());
        }

        if (existingUser.getPhotoURL() != null && !existingUser.getPhotoURL().isEmpty()) {
            newUser.setPhotoURL(existingUser.getPhotoURL());
        }

        if (existingUser.getEmail() != null && !existingUser.getEmail().isEmpty()) {
            newUser.setEmail(existingUser.getEmail());
        }

        Map<Function<User, String>, BiConsumer<User, String>> fieldMap = new HashMap<>();
        fieldMap.put(User::getCompany, User::setCompany);
        fieldMap.put(User::getCity, User::setCity);
        fieldMap.put(User::getPhoneNumber, User::setPhoneNumber);
        fieldMap.put(User::getGithubLink, User::setGithubLink);
        fieldMap.put(User::getTwitterLink, User::setTwitterLink);
        fieldMap.put(User::getBlueSkyLink, User::setBlueSkyLink);
        fieldMap.put(User::getLinkedInLink, User::setLinkedInLink);
        fieldMap.put(User::getBiography, User::setBiography);
        fieldMap.put(User::getOtherLink, User::setOtherLink);

        fieldMap.forEach((getter, setter) -> {
            if (getter.apply(newUser) == null) {
                setter.accept(newUser, getter.apply(existingUser));
            }
        });

        return newUser;
    }

    private void validateRequiredFields(User user) {
        Map<String, String> validationErrors = new HashMap<>();

        if (user.getUid() == null || user.getUid().trim().isEmpty()) {
            validationErrors.put("uid", "User ID is required");
        }

        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            validationErrors.put("email", "Email is required");
        } else if (!isValidEmail(user.getEmail())) {
            validationErrors.put("email", "Invalid email format");
        }

        if (user.getDisplayName() != null && !user.getDisplayName().isEmpty()
                && user.getDisplayName().length() < 2) {
            validationErrors.put("displayName", "Display name must be at least 2 characters");
        }

        if (!validationErrors.isEmpty()) {
            throw new ValidationException("User validation failed", validationErrors);
        }
    }

    private void validateFullUser(User user) {
        Map<String, String> validationErrors = new HashMap<>();

        if (user.getUid() == null || user.getUid().trim().isEmpty()) {
            validationErrors.put("uid", "User ID is required");
        }

        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            validationErrors.put("email", "Email is required");
        } else if (!isValidEmail(user.getEmail())) {
            validationErrors.put("email", "Invalid email format");
        }

        validateOptionalField(user.getDisplayName(), "displayName",
                "Display name must be at least 2 characters", 2, validationErrors);
        validateOptionalField(user.getCompany(), "company",
                "Company name must be at least 2 characters", 2, validationErrors);
        validateOptionalField(user.getCity(), "city",
                "City must be at least 2 characters", 2, validationErrors);

        validateOptionalUrl(user.getPhotoURL(), "photoURL",
                "Invalid photo URL format", validationErrors);
        validateOptionalUrl(user.getGithubLink(), "githubLink",
                "Invalid GitHub URL format", validationErrors);
        validateOptionalUrl(user.getTwitterLink(), "twitterLink",
                "Invalid Twitter URL format", validationErrors);
        validateOptionalUrl(user.getBlueSkyLink(), "blueSkyLink",
                "Invalid BlueSky URL format", validationErrors);
        validateOptionalUrl(user.getLinkedInLink(), "linkedInLink",
                "Invalid LinkedIn URL format", validationErrors);
        validateOptionalUrl(user.getOtherLink(), "otherLink",
                "Invalid URL format", validationErrors);

        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isEmpty()
                && !user.getPhoneNumber().matches("^(\\+?[0-9\\s.-]{6,})?$")) {
            validationErrors.put("phoneNumber", "Invalid phone number format");
        }

        if (!validationErrors.isEmpty()) {
            throw new ValidationException("User validation failed", validationErrors);
        }
    }

    private void validateOptionalField(String value, String fieldName, String errorMessage,
                                       int minLength, Map<String, String> errors) {
        if (value != null && !value.isEmpty() && value.length() < minLength) {
            errors.put(fieldName, errorMessage);
        }
    }

    private void validateOptionalUrl(String url, String fieldName, String errorMessage,
                                     Map<String, String> errors) {
        if (url != null && !url.isEmpty() && !isValidUrl(url)) {
            errors.put(fieldName, errorMessage);
        }
    }

    private Map<String, String> validatePartialUser(User partialUser) {
        Map<String, String> validationErrors = new HashMap<>();

        validateOptionalField(partialUser.getDisplayName(), "displayName",
                "Display name must be at least 2 characters", 2, validationErrors);
        validateOptionalField(partialUser.getCompany(), "company",
                "Company name must be at least 2 characters", 2, validationErrors);
        validateOptionalField(partialUser.getCity(), "city",
                "City must be at least 2 characters", 2, validationErrors);

        validateOptionalUrl(partialUser.getPhotoURL(), "photoURL",
                "Invalid photo URL format", validationErrors);
        validateOptionalUrl(partialUser.getGithubLink(), "githubLink",
                "Invalid GitHub URL format", validationErrors);
        validateOptionalUrl(partialUser.getTwitterLink(), "twitterLink",
                "Invalid Twitter URL format", validationErrors);
        validateOptionalUrl(partialUser.getBlueSkyLink(), "blueSkyLink",
                "Invalid BlueSky URL format", validationErrors);
        validateOptionalUrl(partialUser.getLinkedInLink(), "linkedInLink",
                "Invalid LinkedIn URL format", validationErrors);
        validateOptionalUrl(partialUser.getOtherLink(), "otherLink",
                "Invalid URL format", validationErrors);

        if (partialUser.getPhoneNumber() != null && !partialUser.getPhoneNumber().isEmpty()
                && !partialUser.getPhoneNumber().matches("^(\\+?[0-9\\s.-]{6,})?$")) {
            validationErrors.put("phoneNumber", "Invalid phone number format");
        }

        return validationErrors;
    }

    private boolean isValidUrl(String url) {
        try {
            new URL(url).toURI();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isValidEmail(String email) {
        return email.matches("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");
    }

    public List<TeamMemberDTO> searchUsersByEmail(String emailQuery) {
        String normalizedQuery = emailQuery.toLowerCase();

        try {
            QuerySnapshot querySnapshot = firestore.collection(COLLECTION_NAME)
                    .whereGreaterThanOrEqualTo("email", normalizedQuery)
                    .whereLessThanOrEqualTo("email", normalizedQuery + "\uf8ff")
                    .limit(10)
                    .get()
                    .get();

            return querySnapshot.getDocuments().stream()
                    .map(doc -> {
                        User user = doc.toObject(User.class);
                        if (user != null && user.getEmail() != null) {
                            TeamMemberDTO memberDTO = new TeamMemberDTO();
                            memberDTO.setUserId(doc.getId());
                            memberDTO.setDisplayName(user.getDisplayName());
                            memberDTO.setPhotoURL(user.getPhotoURL());
                            memberDTO.setEmail(user.getEmail());
                            return memberDTO;
                        }
                        return null;
                    })
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to search users", e);
        }
    }

    public void processUserLogin(String email, String uid) {
        if (email == null || uid == null) {
            logger.error("Email or UID is null");
            return;
        }

        email = email.toLowerCase();
        List<Team> teamsWithInvitation = teamRepository.findTeamsByInvitedEmail(email);

        for (Team team : teamsWithInvitation) {
            String temporaryUserId = team.getTemporaryUserIdByEmail(email);
            if (temporaryUserId != null) {
                team.updateMemberId(temporaryUserId, uid);

                team.getMembers().stream()
                        .filter(member -> member.getUserId().equals(uid))
                        .findFirst()
                        .ifPresent(member -> member.setStatus("active"));

                team.removeInvitedEmail(email);
                teamRepository.save(team);
            }
        }
    }

    public UserDTO partialUpdateUser(UserDTO partialUserDTO, UserDTO existingUserDTO) {
        User existingUser = userMapper.convertToEntity(existingUserDTO);
        User partialUser = userMapper.convertToEntity(partialUserDTO);

        User updatedUser = mergeUsers(partialUser, existingUser);

        Map<String, String> validationErrors = validatePartialUser(partialUser);

        if (!validationErrors.isEmpty()) {
            throw new ValidationException("User validation failed", validationErrors);
        }

        try {
            firestore.collection(COLLECTION_NAME)
                    .document(updatedUser.getUid())
                    .set(updatedUser)
                    .get();

            return userMapper.convertToDTO(updatedUser);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    private User mergeUsers(User partialUser, User existingUser) {
        User updatedUser = new User();

        updatedUser.setUid(existingUser.getUid());
        updatedUser.setEmail(existingUser.getEmail());

        Map<Function<User, String>, BiConsumer<User, String>> fieldMap = new HashMap<>();
        fieldMap.put(User::getDisplayName, User::setDisplayName);
        fieldMap.put(User::getPhotoURL, User::setPhotoURL);
        fieldMap.put(User::getCompany, User::setCompany);
        fieldMap.put(User::getCity, User::setCity);
        fieldMap.put(User::getPhoneNumber, User::setPhoneNumber);
        fieldMap.put(User::getGithubLink, User::setGithubLink);
        fieldMap.put(User::getTwitterLink, User::setTwitterLink);
        fieldMap.put(User::getBlueSkyLink, User::setBlueSkyLink);
        fieldMap.put(User::getLinkedInLink, User::setLinkedInLink);
        fieldMap.put(User::getBiography, User::setBiography);
        fieldMap.put(User::getOtherLink, User::setOtherLink);

        fieldMap.forEach((getter, setter) -> {
            String partialValue = getter.apply(partialUser);
            String existingValue = getter.apply(existingUser);
            setter.accept(updatedUser, partialValue != null ? partialValue : existingValue);
        });

        return updatedUser;
    }
}
