package com.speakerspace.model.session;

import com.speakerspace.dto.UserDTO;
import com.speakerspace.dto.session.SpeakerDTO;
import lombok.Builder;

import java.util.List;

@Builder
public record UserSpeakerProfileDTO(
        UserDTO user,
        List<SpeakerDTO> speakers,
        List<SessionImportData> sessions,
        String eventId
) {}
