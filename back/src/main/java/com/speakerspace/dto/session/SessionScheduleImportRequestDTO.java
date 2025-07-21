package com.speakerspace.dto.session;

import lombok.Builder;

import java.util.List;

@Builder
public record SessionScheduleImportRequestDTO (String eventId, List<SessionScheduleImportDataDTO> sessions) {}
