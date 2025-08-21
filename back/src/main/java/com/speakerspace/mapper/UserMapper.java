package com.speakerspace.mapper;

import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.model.User;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Date;

@Component
public class UserMapper {

    public UserDTO convertToDTO(User user) {
        if (user == null) return null;

        return new UserDTO(
                user.getUid(),
                user.getEmail(),
                user.getName(),
                user.getPhotoURL(),
                user.getCompany(),
                user.getLocation(),
                user.getPhoneNumber(),
                user.getBio(),
                user.getSocialLinks() != null ? new ArrayList<>(user.getSocialLinks()) : new ArrayList<>(),
                user.getSpeakerIds() != null ? new ArrayList<>(user.getSpeakerIds()) : new ArrayList<>(),
                user.getEventIds() != null ? new ArrayList<>(user.getEventIds()) : new ArrayList<>(),
                user.getSessionIds() != null ? new ArrayList<>(user.getSessionIds()) : new ArrayList<>()
        );
    }

    public User convertToEntity(UserDTO userDTO) {
        if (userDTO == null) return null;

        User user = new User();
        user.setUid(userDTO.uid());
        user.setEmail(userDTO.email());
        user.setName(userDTO.name());
        user.setPhotoURL(userDTO.photoURL());
        user.setCompany(userDTO.company());
        user.setLocation(userDTO.location());
        user.setPhoneNumber(userDTO.phoneNumber());
        user.setBio(userDTO.bio());
        user.setSocialLinks(userDTO.socialLinks() != null ?
                new ArrayList<>(userDTO.socialLinks()) : new ArrayList<>());
        user.setSpeakerIds(userDTO.speakerIds() != null ?
                new ArrayList<>(userDTO.speakerIds()) : new ArrayList<>());
        user.setEventIds(userDTO.eventIds() != null ?
                new ArrayList<>(userDTO.eventIds()) : new ArrayList<>());
        user.setSessionIds(userDTO.sessionIds() != null ?
                new ArrayList<>(userDTO.sessionIds()) : new ArrayList<>());
        return user;
    }

    public UserDTO createFromFirebaseToken(FirebaseToken decodedToken) {
        if (decodedToken == null) return null;

        return UserDTO.builder()
                .uid(decodedToken.getUid())
                .email(decodedToken.getEmail())
                .name(decodedToken.getName())
                .photoURL(decodedToken.getPicture())
                .socialLinks(new ArrayList<>())
                .speakerIds(new ArrayList<>())
                .eventIds(new ArrayList<>())
                .sessionIds(new ArrayList<>())
                .build();
    }

    public UpdateResult updateFromFirebaseTokenIfNeeded(UserDTO existingUser, FirebaseToken decodedToken) {
        if (existingUser == null || decodedToken == null) {
            return new UpdateResult(existingUser, false);
        }

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

        if (isNullOrEmpty(existingUser.name()) && decodedToken.getName() != null) {
            builder.name(decodedToken.getName());
            needsUpdate = true;
        }

        if (isNullOrEmpty(existingUser.photoURL()) && decodedToken.getPicture() != null) {
            builder.photoURL(decodedToken.getPicture());
            needsUpdate = true;
        }

        UserDTO updatedUser = needsUpdate ? builder.build() : existingUser;
        return new UpdateResult(updatedUser, needsUpdate);
    }

    public User updateEntityFromDTO(UserDTO dto, User existingUser) {
        if (dto == null || existingUser == null) {
            return existingUser;
        }

        if (dto.name() != null) {
            existingUser.setName(dto.name());
        }

        if (dto.photoURL() != null) {
            existingUser.setPhotoURL(dto.photoURL());
        }

        if (dto.company() != null) {
            existingUser.setCompany(dto.company());
        }

        if (dto.location() != null) {
            existingUser.setLocation(dto.location());
        }

        if (dto.phoneNumber() != null) {
            existingUser.setPhoneNumber(dto.phoneNumber());
        }

        if (dto.bio() != null) {
            existingUser.setBio(dto.bio());
        }

        if (dto.socialLinks() != null) {
            existingUser.setSocialLinks(new ArrayList<>(dto.socialLinks()));
        }

        existingUser.setUpdatedAt(new Date());
        return existingUser;
    }

    private boolean isNullOrEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }

    public static class UpdateResult {
        @Getter
        private final UserDTO userDTO;
        private final boolean wasUpdated;

        public UpdateResult(UserDTO userDTO, boolean wasUpdated) {
            this.userDTO = userDTO;
            this.wasUpdated = wasUpdated;
        }

        public boolean wasUpdated() {
            return wasUpdated;
        }
    }
}
