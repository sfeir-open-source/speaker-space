package com.speakerspace.dto.session;

import lombok.Builder;

import java.util.List;

@Builder
public record SessionReviewImportRequestDTO (String eventId, List<SessionDTO> sessions){}
