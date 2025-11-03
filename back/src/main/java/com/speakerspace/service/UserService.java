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
                        .name(user.getName())
                        .photoURL(user.getPhotoURL())
                        .email(user.getEmail())
                        .build())
                .toList();
    }

    public void processUserLogin(String email, String uid) {
        if (email == null || uid == null) {
            log.warn("Email or UID is null, skipping invitation processing");
            return;
        }

        String normalizedEmail = email.toLowerCase();

        Optional<User> userOpt = Optional.empty();
        int maxRetries = 5;

        for (int i = 0; i < maxRetries; i++) {
            userOpt = userRepository.findUserByIdOptional(uid);

            if (userOpt.isPresent()) {
                log.info("User found in database: {} (attempt {}/{})", uid, i + 1, maxRetries);
                break;
            }

            if (i < maxRetries - 1) {
                try {
                    Thread.sleep(300 * (i + 1));
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.error("Thread interrupted during retry", e);
                    return;
                }
            }
        }

        if (userOpt.isEmpty()) {
            log.error("User {} not found in database after {} retries, skipping invitation processing",
                    uid, maxRetries);
            return;
        }

        User user = userOpt.get();

        List<Team> teamsWithInvitation = teamRepository.findTeamsByInvitedEmail(normalizedEmail);

        if (teamsWithInvitation.isEmpty()) {
            log.info("No pending invitations found for email {}", normalizedEmail);
            return;
        }

        int processedCount = 0;
        for (Team team : teamsWithInvitation) {
            String temporaryUserId = team.getTemporaryUserIdByEmail(normalizedEmail);

            if (temporaryUserId == null) {
                log.warn("No temporary user ID found for email {} in team {}",
                        normalizedEmail, team.getId());
                continue;
            }

            team.updateMemberId(temporaryUserId, uid);

            boolean memberUpdated = team.getMembers().stream()
                    .filter(member -> member.getUserId().equals(uid))
                    .findFirst()
                    .map(member -> {
                        member.setEmail(normalizedEmail);
                        member.setStatus("active");

                        if (user.getName() != null && !user.getName().isEmpty()) {
                            member.setDisplayName(user.getName());
                        }

                        if (user.getPhotoURL() != null && !user.getPhotoURL().isEmpty()) {
                            member.setPhotoURL(user.getPhotoURL());
                        }

                        return true;
                    })
                    .orElse(false);

            if (!memberUpdated) {
                log.warn("Failed to update member {} in team {}", uid, team.getId());
                continue;
            }

            team.removeInvitedEmail(normalizedEmail);

            try {
                Team savedTeam = teamRepository.saveTeam(team);
                log.info("Team {} saved successfully. Member count: {}, Active members: {}",
                        savedTeam.getId(),
                        savedTeam.getMembers().size(),
                        savedTeam.getMembers().stream()
                                .filter(m -> "active".equals(m.getStatus()))
                                .count());
                processedCount++;
            } catch (Exception e) {
                log.error("Failed to save team {}: {}", team.getId(), e.getMessage(), e);
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
        if (existingUser.getName() != null && !existingUser.getName().isEmpty()) {
            newUser.setName(existingUser.getName());
        }

        if (existingUser.getPhotoURL() != null && !existingUser.getPhotoURL().isEmpty()) {
            newUser.setPhotoURL(existingUser.getPhotoURL());
        }

        if (existingUser.getEmail() != null && !existingUser.getEmail().isEmpty()) {
            newUser.setEmail(existingUser.getEmail());
        }

        Map<Function<User, String>, BiConsumer<User, String>> fieldMap = new HashMap<>();
        fieldMap.put(User::getCompany, User::setCompany);
        fieldMap.put(User::getLocation, User::setLocation);
        fieldMap.put(User::getPhoneNumber, User::setPhoneNumber);
        fieldMap.put(User::getBio, User::setBio);

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

        if (user.getName() != null && user.getName().length() == 1) {
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

        validateOptionalField(user.getName(), "name",
                "Name must be at least 2 characters", validationErrors);
        validateOptionalField(user.getCompany(), "company",
                "Company name must be at least 2 characters", validationErrors);
        validateOptionalField(user.getLocation(), "location",
                "Location must be at least 2 characters", validationErrors);

        validateOptionalUrl(user.getPhotoURL(), "photoURL",
                "Invalid photo URL format", validationErrors);


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

        validateOptionalField(partialUser.getName(), "Name",
                "Name must be at least 2 characters", validationErrors);
        validateOptionalField(partialUser.getCompany(), "company",
                "Company name must be at least 2 characters", validationErrors);
        validateOptionalField(partialUser.getLocation(), "location",
                "Location must be at least 2 characters", validationErrors);

        validateOptionalUrl(partialUser.getPhotoURL(), "photoURL",
                "Invalid photo URL format", validationErrors);


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

        Map<Function<User, String>, BiConsumer<User, String>> stringFieldMap = new HashMap<>();
        stringFieldMap.put(User::getName, User::setName);
        stringFieldMap.put(User::getPhotoURL, User::setPhotoURL);
        stringFieldMap.put(User::getCompany, User::setCompany);
        stringFieldMap.put(User::getLocation, User::setLocation);
        stringFieldMap.put(User::getPhoneNumber, User::setPhoneNumber);
        stringFieldMap.put(User::getBio, User::setBio);

        stringFieldMap.forEach((getter, setter) -> {
            String partialValue = getter.apply(partialUser);
            String existingValue = getter.apply(existingUser);
            setter.accept(updatedUser, partialValue != null ? partialValue : existingValue);
        });

        Map<Function<User, List<String>>, BiConsumer<User, List<String>>> listFieldMap = new HashMap<>();
        listFieldMap.put(User::getSocialLinks, User::setSocialLinks);
        listFieldMap.put(User::getSpeakerIds, User::setSpeakerIds);
        listFieldMap.put(User::getEventIds, User::setEventIds);
        listFieldMap.put(User::getSessionIds, User::setSessionIds);

        listFieldMap.forEach((getter, setter) -> {
            List<String> partialValue = getter.apply(partialUser);
            List<String> existingValue = getter.apply(existingUser);
            if (partialValue != null && !partialValue.isEmpty()) {
                setter.accept(updatedUser, new ArrayList<>(partialValue));
            } else if (existingValue != null) {
                setter.accept(updatedUser, new ArrayList<>(existingValue));
            }
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
                .name(decodedToken.getName())
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
                .name(existingUser.name())
                .photoURL(existingUser.photoURL())
                .company(existingUser.company())
                .location(existingUser.location())
                .phoneNumber(existingUser.phoneNumber())
                .bio(existingUser.bio())
                .socialLinks(existingUser.socialLinks())
                .speakerIds(existingUser.speakerIds())
                .eventIds(existingUser.eventIds())
                .sessionIds(existingUser.sessionIds());

        if (existingUser.email() == null && decodedToken.getEmail() != null) {
            builder.email(decodedToken.getEmail());
            needsUpdate = true;
        }

        if ((existingUser.name() == null || existingUser.name().isEmpty())
                && decodedToken.getName() != null) {
            builder.name(decodedToken.getName());
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
