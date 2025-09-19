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
            user.getDisplayName(),
            user.getPhotoURL(),
            user.getCompany(),
            user.getCity(),
            user.getPhoneNumber(),
            user.getGithubLink(),
            user.getTwitterLink(),
            user.getBlueSkyLink(),
            user.getLinkedInLink(),
            user.getBiography(),
            user.getOtherLink()
        );
    }

    public User convertToEntity(UserDTO userDTO) {
        if (userDTO  == null) return null;

        User user = new User();
        user.setUid(userDTO.uid());
        user.setEmail(userDTO.email());
        user.setDisplayName(userDTO.displayName());
        user.setPhotoURL(userDTO.photoURL());
        user.setCompany(userDTO.company());
        user.setCity(userDTO.city());
        user.setPhoneNumber(userDTO.phoneNumber());
        user.setGithubLink(userDTO.githubLink());
        user.setTwitterLink(userDTO.twitterLink());
        user.setBlueSkyLink(userDTO.blueSkyLink());
        user.setLinkedInLink(userDTO.linkedInLink());
        user.setBiography(userDTO.biography());
        user.setOtherLink(userDTO.otherLink());
        return user;
    }

    public User updateEntityFromDTO(UserDTO dto, User existingUser) {
        if (dto == null || existingUser == null) {
            return existingUser;
        }

        if (dto.displayName() != null) {
            existingUser.setDisplayName(dto.displayName());
        }

        if (dto.photoURL() != null) {
            existingUser.setPhotoURL(dto.photoURL());
        }

        if (dto.company() != null) {
            existingUser.setCompany(dto.company());
        }

        if (dto.city() != null) {
            existingUser.setCity(dto.city());
        }

        if (dto.phoneNumber() != null) {
            existingUser.setPhoneNumber(dto.phoneNumber());
        }

        if (dto.githubLink() != null) {
            existingUser.setGithubLink(dto.githubLink());
        }

        if (dto.twitterLink() != null) {
            existingUser.setTwitterLink(dto.twitterLink());
        }

        if (dto.blueSkyLink() != null) {
            existingUser.setBlueSkyLink(dto.blueSkyLink());
        }

        if (dto.linkedInLink() != null) {
            existingUser.setLinkedInLink(dto.linkedInLink());
        }

        if (dto.biography() != null) {
            existingUser.setBiography(dto.biography());
        }

        if (dto.otherLink() != null) {
            existingUser.setOtherLink(dto.otherLink());
        }

        return existingUser;
    }
}
