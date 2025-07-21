package com.speakerspace.dto.session;

import lombok.Builder;

@Builder
public record FormatDTO ( String id, String name, String description){
}
