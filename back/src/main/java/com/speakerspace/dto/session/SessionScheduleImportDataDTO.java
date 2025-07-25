package com.speakerspace.dto.session;

import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record SessionScheduleImportDataDTO (
        String id,
        LocalDateTime start,
        LocalDateTime end,
        String track,
        String title,
        String languages,
        ProposalScheduleDTO proposal,
        String eventId
) {}

