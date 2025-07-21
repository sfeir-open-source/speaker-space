package com.speakerspace.dto.session;

import lombok.Builder;

import java.util.List;

@Builder
public record SpeakerDTO (String id,
        String name,
        String bio,
        String company,
        String references,
        String picture,
        String location,
        String email,
        List<String> socialLinks){}
