package com.speakerspace.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.exception.FirebaseAuthenticationException;
import com.speakerspace.exception.TokenExpiredException;
import com.speakerspace.exception.UnauthorizedException;
import com.speakerspace.exception.ValidationException;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.model.Team;
import com.speakerspace.model.User;
import com.speakerspace.repository.TeamRepository;
import com.speakerspace.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.nio.file.AccessDeniedException;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final FirebaseAuth firebaseAuth;
    private final CookieService cookieService;
    private static final int MIN_LENGTH = 2;

    public UserDTO saveUser(UserDTO userDTO) {
        User user = userMapper.convertToEntity(userDTO);
        validateRequiredFields(user);

        Optional<User> existingUserOpt = userRepository.findUserByIdOptional(user.getUid());
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            preserveExistingFields(user, existingUser);
        }

        User savedUser = userRepository.saveUser(user);
        return userMapper.convertToDTO(savedUser);
    }

    public UserDTO getUserByUid(String uid) {
        User user = userRepository.findUserById(uid);
        return user != null ? userMapper.convertToDTO(user) : null;
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
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.map(userMapper::convertToDTO).orElse(null);
    }

    public UserDTO updateUser(UserDTO userDTO) {
        Optional<User> existingUserOpt = userRepository.findUserByIdOptional(userDTO.uid());
        if (existingUserOpt.isEmpty()) {
            return null;
        }

        User existingUser = existingUserOpt.get();
        User updatedUser = userMapper.updateEntityFromDTO(userDTO, existingUser);
        validateFullUser(updatedUser);

        User savedUser = userRepository.saveUser(updatedUser);
        return userMapper.convertToDTO(savedUser);
    }

    public List<TeamMemberDTO> searchUsersByEmail(String emailQuery) {
        List<User> users = userRepository.searchUsersByEmail(emailQuery, 10);

        return users.stream()
                .filter(user -> user.getEmail() != null)
                .map(user -> TeamMemberDTO.builder()
                        .userId(user.getUid())
                        .displayName(user.getDisplayName())
                        .photoURL(user.getPhotoURL())
                        .email(user.getEmail())
                        .build())
                .toList();
    }

    public void processUserLogin(String email, String uid) {
        if (email == null || uid == null) {
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
                teamRepository.saveTeam(team);
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

        User savedUser = userRepository.saveUser(updatedUser);
        return userMapper.convertToDTO(savedUser);
    }

    private void preserveExistingFields(User newUser, User existingUser) {
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

        if (user.getDisplayName() != null && user.getDisplayName().length() == 1) {
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
                "Display name must be at least 2 characters", validationErrors);
        validateOptionalField(user.getCompany(), "company",
                "Company name must be at least 2 characters", validationErrors);
        validateOptionalField(user.getCity(), "city",
                "City must be at least 2 characters", validationErrors);

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
                                       Map<String, String> errors) {
        if (value != null && !value.isEmpty() && value.length() < MIN_LENGTH) {
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
                "Display name must be at least 2 characters", validationErrors);
        validateOptionalField(partialUser.getCompany(), "company",
                "Company name must be at least 2 characters", validationErrors);
        validateOptionalField(partialUser.getCity(), "city",
                "City must be at least 2 characters", validationErrors);

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

    public FirebaseToken verifyFirebaseToken(String idToken) {
        try {
            return firebaseAuth.verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            log.error("Firebase token verification failed: {}", e.getMessage());
            throw new FirebaseAuthenticationException("Invalid token");
        }
    }

    public UserDTO createNewUser(FirebaseToken decodedToken) {
        UserDTO userDTO = UserDTO.builder()
                .uid(decodedToken.getUid())
                .email(decodedToken.getEmail())
                .displayName(decodedToken.getName())
                .photoURL(decodedToken.getPicture())
                .build();

        UserDTO createdUser = this.saveUser(userDTO);
        if (createdUser == null) {
            throw new RuntimeException("Failed to create user");
        }
        return createdUser;
    }

    public UserDTO updateExistingUserIfNeeded(UserDTO existingUser, FirebaseToken decodedToken) {
        boolean needsUpdate = false;
        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .uid(existingUser.uid())
                .email(existingUser.email())
                .displayName(existingUser.displayName())
                .photoURL(existingUser.photoURL())
                .company(existingUser.company())
                .city(existingUser.city())
                .phoneNumber(existingUser.phoneNumber())
                .githubLink(existingUser.githubLink())
                .twitterLink(existingUser.twitterLink())
                .blueSkyLink(existingUser.blueSkyLink())
                .linkedInLink(existingUser.linkedInLink())
                .biography(existingUser.biography())
                .otherLink(existingUser.otherLink());

        if (existingUser.email() == null && decodedToken.getEmail() != null) {
            builder.email(decodedToken.getEmail());
            needsUpdate = true;
        }

        if ((existingUser.displayName() == null || existingUser.displayName().isEmpty())
                && decodedToken.getName() != null) {
            builder.displayName(decodedToken.getName());
            needsUpdate = true;
        }

        if ((existingUser.photoURL() == null || existingUser.photoURL().isEmpty())
                && decodedToken.getPicture() != null) {
            builder.photoURL(decodedToken.getPicture());
            needsUpdate = true;
        }

        if (needsUpdate) {
            UserDTO updatedUserDTO = builder.build();
            return this.saveUser(updatedUserDTO);
        }

        return existingUser;
    }

    public String authenticateAndAuthorize(HttpServletRequest request, String targetUid) {
        String token = cookieService.getAuthTokenFromCookies(request);
        if (token == null) {
            throw new UnauthorizedException("Authentication required");
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String tokenUid = decodedToken.getUid();

            if (!tokenUid.equals(targetUid)) {
                throw new AccessDeniedException("Not authorized to access this profile");
            }

            return tokenUid;
        } catch (FirebaseAuthException | AccessDeniedException e) {
            if (e.getMessage().contains("expired")) {
                throw new TokenExpiredException("Token expired, please refresh");
            }
            throw new FirebaseAuthenticationException("Token verification failed", e);
        }
    }
}
