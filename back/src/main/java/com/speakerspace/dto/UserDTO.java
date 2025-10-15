package com.speakerspace.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record UserDTO(
        String uid,
        String email,
        String name,
        String photoURL,
        String company,
        String location,
        String phoneNumber,
        String bio,
        List<String> socialLinks,

        List<String> speakerIds,
        List<String> eventIds,
        List<String> sessionIds
) {}
