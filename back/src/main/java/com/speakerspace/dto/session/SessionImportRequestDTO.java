package com.speakerspace.dto.session;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import java.util.ArrayList;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SessionImportRequestDTO {

    @JsonProperty("eventId")
    @NotBlank(message = "Event ID is required")
    private String eventId;

    @JsonProperty("sessions")
    @NotNull(message = "Sessions list is required")
    @Valid
    private List<SessionImportDTO> sessions;

    public SessionImportRequestDTO() {
        this.sessions = new ArrayList<>();
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public List<SessionImportDTO> getSessions() { return sessions; }
}
