package com.speakerspace.dto.session;

import lombok.Builder;

@Builder
public record CategoryDTO (String id, String name, String description) {}
