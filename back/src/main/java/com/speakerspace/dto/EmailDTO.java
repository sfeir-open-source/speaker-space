package com.speakerspace.dto;

import lombok.Builder;

@Builder
public record EmailDTO ( String email, String uid) {}