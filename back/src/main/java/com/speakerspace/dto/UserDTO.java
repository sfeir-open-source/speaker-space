package com.speakerspace.dto;

import lombok.Builder;

@Builder
public record UserDTO (
        String uid,
        String email,
        String displayName,
        String photoURL,
        String company,
        String city,
        String phoneNumber,
        String githubLink,
        String twitterLink,
        String blueSkyLink,
        String linkedInLink,
        String biography,
        String otherLink
){}
