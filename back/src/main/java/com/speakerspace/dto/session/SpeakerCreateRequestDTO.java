package com.speakerspace.dto.session;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record SpeakerCreateRequestDTO(
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        String name,

        @Size(max = 2000, message = "Bio must not exceed 2000 characters")
        String bio,

        @Size(max = 100, message = "Company must not exceed 100 characters")
        String company,

        @Size(max = 2000, message = "References must not exceed 2000 characters")
        String references,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 100, message = "Email must not exceed 100 characters")
        String email,

        @Size(max = 500, message = "Picture URL must not exceed 500 characters")
        String picture,

        @Size(max = 100, message = "Location must not exceed 100 characters")
        String location,

        @Valid
        List<@Size(max = 200, message = "Social link must not exceed 200 characters") String> socialLinks
) {}
