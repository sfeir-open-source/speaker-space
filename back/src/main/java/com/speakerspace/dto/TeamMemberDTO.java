package com.speakerspace.dto;

import lombok.Builder;

@Builder
public record TeamMemberDTO (
        String userId,
        String role,
        String displayName,
        String email,
        String photoURL,
        String status
){}
