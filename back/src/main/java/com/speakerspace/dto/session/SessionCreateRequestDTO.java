package com.speakerspace.dto.session;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.Date;
import java.util.List;

@Builder
public record SessionCreateRequestDTO(
        @NotBlank(message = "Title is required")
        @Size(max = 50, message = "Title must not exceed 50 characters")
        String title,

        @Size(max = 2000, message = "Abstract must not exceed 2000 characters")
        String abstractText,

        @Size(max = 1000, message = "References must not exceed 1000 characters")
        String references,

        String level,
        String track,

        List<String> languages,
        List<FormatDTO> formats,
        List<CategoryDTO> categories,
        List<SpeakerDTO> speakers,

        @NotBlank(message = "Event ID is required")
        String eventId,

        String deliberationStatus,
        String confirmationStatus,

        Date start,
        Date end
) {}
