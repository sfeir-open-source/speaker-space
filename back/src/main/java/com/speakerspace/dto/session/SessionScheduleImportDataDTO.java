package com.speakerspace.dto.session;

import lombok.Builder;

import java.util.Date;

@Builder
public record SessionScheduleImportDataDTO (
        String id,
        Date start,
        Date end,
        String track,
        String title,
        String languages,
        ProposalScheduleDTO proposal,
        String eventId
) {}

