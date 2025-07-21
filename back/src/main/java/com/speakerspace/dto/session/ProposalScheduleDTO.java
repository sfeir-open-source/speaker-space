package com.speakerspace.dto.session;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.util.List;

@Builder
public record ProposalScheduleDTO (
        String id,

        @JsonProperty("abstract")
        String abstractText,

        String level,
        List<String> formats,
        List<String> categories,
        List<SpeakerDTO> speakers
){}