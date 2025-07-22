package com.speakerspace.dto.session;

import lombok.Builder;

import java.util.Date;
import java.util.List;

@Builder
public record SessionDTO (
        String id,
        String title,
        String abstractText,
        String deliberationStatus,
        String confirmationStatus,
        String level,
        String references,
        List<FormatDTO> formats,
        List<CategoryDTO> categories,
        List<String> tags,
        List<String> languages,
        List<SpeakerDTO> speakers,
        ReviewDTO reviews,
        String eventId,
        Date start,
        Date end,
        String track,
        Date createdAt,
        Date updatedAt
){}