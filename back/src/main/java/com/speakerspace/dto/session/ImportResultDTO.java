package com.speakerspace.dto.session;

import lombok.Builder;

import java.util.List;

@Builder
public record ImportResultDTO(
        List<String> successfulImports,
        List<String> failedImports,
        List<String> skippedImports,
        int totalCount,
        int successCount,
        List<String> errors
) {}
