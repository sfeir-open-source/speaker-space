package com.speakerspace.dto.session;

import lombok.Builder;

@Builder
public record ReviewDTO (double average, int positives, int negatives) {}
