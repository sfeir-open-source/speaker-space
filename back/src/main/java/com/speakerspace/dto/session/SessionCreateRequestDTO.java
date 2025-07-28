package com.speakerspace.dto.session;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.Date;
import java.util.List;

@Builder
public record SessionCreateRequestDTO(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
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

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        Date start,

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        Date end
) {}
