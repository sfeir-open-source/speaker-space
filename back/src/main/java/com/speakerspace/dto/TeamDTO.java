package com.speakerspace.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record TeamDTO (    
        String id,
        String name,
        String url,
        String userCreateId,
        String creatorEmail,
        List<String> memberIds,
        List<TeamMemberDTO> members){}
