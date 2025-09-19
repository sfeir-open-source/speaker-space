package com.speakerspace.dto;

import lombok.Builder;

@Builder
public record EventDTO (
        String idEvent,
        String eventName,
        String description,
        String endDate,
        String url,
        String startDate,
        Boolean isOnline,
        String location,
        Boolean isPrivate,
        String webLinkUrl,
        Boolean isFinish,
        String userCreateId,
        String conferenceHallUrl,
        String teamId,
        String timeZone,
        String logoBase64,
        String type
){}
