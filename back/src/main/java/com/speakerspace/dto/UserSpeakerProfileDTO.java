package com.speakerspace.dto;

import com.speakerspace.dto.session.SpeakerDTO;
import com.speakerspace.model.session.SessionImportData;
import lombok.Builder;

import java.util.List;

@Builder
public record UserSpeakerProfileDTO(
        UserDTO user,
        List<SpeakerDTO> speakers,
        List<SessionImportData> sessions,
        String eventId
) {}
