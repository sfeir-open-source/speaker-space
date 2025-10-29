package com.speakerspace.dto;

import lombok.Builder;

@Builder
public record EventDTO(
        String idEvent,
        String eventName,
        String description,
        String endDate,
        String url,
        String startDate,
        Boolean online,
        String location,
        Boolean privateEvent,
        String webLinkUrl,
        Boolean finished,
        String userCreateId,
        String conferenceHallUrl,
        String teamId,
        String timeZone,
        String logoBase64,
        String type
) {}
