package com.speakerspace.mapper;

import com.speakerspace.dto.UserDTO;
import com.speakerspace.model.User;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

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

    /**
     * Convertit les anciens champs vers le nouveau format
     */
    public User migrateFromOldFormat(User oldUser) {
        User newUser = new User();
        newUser.setUid(oldUser.getUid());
        newUser.setEmail(oldUser.getEmail());
        newUser.setName(oldUser.getName()); // displayName -> name
        newUser.setPhotoURL(oldUser.getPhotoURL());
        newUser.setCompany(oldUser.getCompany());
        newUser.setLocation(oldUser.getLocation()); // city -> location
        newUser.setPhoneNumber(oldUser.getPhoneNumber());
        newUser.setBio(oldUser.getBio()); // biography -> bio

        // Migration des liens sociaux
        List<String> socialLinks = new ArrayList<>();
        // Ici tu peux ajouter la logique pour convertir les anciens champs individuels
        // vers la liste socialLinks si nécessaire

        newUser.setSocialLinks(socialLinks);
        newUser.setSpeakerIds(new ArrayList<>());
        newUser.setEventIds(new ArrayList<>());
        newUser.setSessionIds(new ArrayList<>());

        return newUser;
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

        // Les IDs de liaison ne sont généralement pas mis à jour via ce mapper
        // Ils sont gérés par le UserSpeakerLinkService

        existingUser.setUpdatedAt(new Date());
        return existingUser;
    }
}
