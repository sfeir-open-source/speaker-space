package com.speakerspace.mapper;

import com.speakerspace.dto.UserDTO;
import com.speakerspace.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO convertToDTO(User user) {
        if (user == null) {
            return null;
        }

        UserDTO userDTO = new UserDTO();
        userDTO.setUid(user.getUid());
        userDTO.setEmail(user.getEmail());
        userDTO.setDisplayName(user.getDisplayName());
        userDTO.setPhotoURL(user.getPhotoURL());
        userDTO.setCompany(user.getCompany());
        userDTO.setCity(user.getCity());
        userDTO.setPhoneNumber(user.getPhoneNumber());
        userDTO.setGithubLink(user.getGithubLink());
        userDTO.setTwitterLink(user.getTwitterLink());
        userDTO.setBlueSkyLink(user.getBlueSkyLink());
        userDTO.setLinkedInLink(user.getLinkedInLink());
        userDTO.setBiography(user.getBiography());
        userDTO.setOtherLink(user.getOtherLink());
        return userDTO;
    }

    public User convertToEntity(UserDTO userDTO) {
        User user = new User();
        user.setUid(userDTO.getUid());
        user.setEmail(userDTO.getEmail());
        user.setDisplayName(userDTO.getDisplayName());
        user.setPhotoURL(userDTO.getPhotoURL());
        user.setCompany(userDTO.getCompany());
        user.setCity(userDTO.getCity());
        user.setPhoneNumber(userDTO.getPhoneNumber());
        user.setGithubLink(userDTO.getGithubLink());
        user.setTwitterLink(userDTO.getTwitterLink());
        user.setBlueSkyLink(userDTO.getBlueSkyLink());
        user.setLinkedInLink(userDTO.getLinkedInLink());
        user.setBiography(userDTO.getBiography());
        user.setOtherLink(userDTO.getOtherLink());
        return user;
    }

    public User updateEntityFromDTO(UserDTO dto, User existingUser) {
        if (dto == null || existingUser == null) {
            return existingUser;
        }

        if (dto.getDisplayName() != null) {
            existingUser.setDisplayName(dto.getDisplayName());
        }

        if (dto.getPhotoURL() != null) {
            existingUser.setPhotoURL(dto.getPhotoURL());
        }

        if (dto.getCompany() != null) {
            existingUser.setCompany(dto.getCompany());
        }

        if (dto.getCity() != null) {
            existingUser.setCity(dto.getCity());
        }

        if (dto.getPhoneNumber() != null) {
            existingUser.setPhoneNumber(dto.getPhoneNumber());
        }

        if (dto.getGithubLink() != null) {
            existingUser.setGithubLink(dto.getGithubLink());
        }

        if (dto.getTwitterLink() != null) {
            existingUser.setTwitterLink(dto.getTwitterLink());
        }

        if (dto.getBlueSkyLink() != null) {
            existingUser.setBlueSkyLink(dto.getBlueSkyLink());
        }

        if (dto.getLinkedInLink() != null) {
            existingUser.setLinkedInLink(dto.getLinkedInLink());
        }

        if (dto.getBiography() != null) {
            existingUser.setBiography(dto.getBiography());
        }

        if (dto.getOtherLink() != null) {
            existingUser.setOtherLink(dto.getOtherLink());
        }

        return existingUser;
    }
}
