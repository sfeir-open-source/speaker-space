package com.speakerspace.mapper;

import com.speakerspace.dto.UserDTO;
import com.speakerspace.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO convertToDTO(User user) {
        if (user  == null) return null;

        return new UserDTO(
            user.getUid(),
            user.getEmail(),
            user.getName(),
            user.getPhotoURL(),
            user.getCompany(),
            user.getLocation(),
            user.getPhoneNumber(),
            user.getBio(),
            user.getSocialLinks(),
            user.getSpeakerIds(),
            user.getEventIds(),
            user.getSessionIds()
        );
    }

    public User convertToEntity(UserDTO userDTO) {
        if (userDTO  == null) return null;

        User user = new User();
        user.setUid(userDTO.uid());
        user.setEmail(userDTO.email());
        user.setName(userDTO.name());
        user.setPhotoURL(userDTO.photoURL());
        user.setCompany(userDTO.company());
        user.setLocation(userDTO.location());
        user.setPhoneNumber(userDTO.phoneNumber());
        user.setBio(userDTO.bio());
        user.setSocialLinks(userDTO.socialLinks());
        user.setSpeakerIds(userDTO.speakerIds());
        user.setEventIds(userDTO.eventIds());
        user.setSessionIds(userDTO.sessionIds());
        return user;
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
            existingUser.setSocialLinks(dto.socialLinks());
        }

        if (dto.speakerIds() != null) {
            existingUser.setSpeakerIds(dto.speakerIds());
        }

        if (dto.eventIds() != null) {
            existingUser.setEventIds(dto.eventIds());
        }

        if (dto.sessionIds() != null) {
            existingUser.setSessionIds(dto.sessionIds());
        }

        return existingUser;
    }
}
