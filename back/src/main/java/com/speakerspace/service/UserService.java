package com.speakerspace.service;

import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.exception.ValidationException;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.model.Team;
import com.speakerspace.model.User;
import com.speakerspace.repository.TeamRepository;
import com.speakerspace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
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
            validationErrors.put("name", "Display name must be at least 2 characters");
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

        Map<Function<User, String>, BiConsumer<User, String>> fieldMap = new HashMap<>();
        fieldMap.put(User::getName, User::setName);
        fieldMap.put(User::getPhotoURL, User::setPhotoURL);
        fieldMap.put(User::getCompany, User::setCompany);
        fieldMap.put(User::getLocation, User::setLocation);
        fieldMap.put(User::getPhoneNumber, User::setPhoneNumber);
        fieldMap.put(User::getBio, User::setBio);

        fieldMap.forEach((getter, setter) -> {
            String partialValue = getter.apply(partialUser);
            String existingValue = getter.apply(existingUser);
            setter.accept(updatedUser, partialValue != null ? partialValue : existingValue);
        });

        return updatedUser;
    }
}
