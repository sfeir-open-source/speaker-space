package com.speakerspace.dto.session;

import java.util.List;

public class SessionImportRequestDTO {
    private String eventId;
    private List<SessionImportDataDTO> sessions;

    public SessionImportRequestDTO() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public List<SessionImportDataDTO> getSessions() { return sessions; }
    public void setSessions(List<SessionImportDataDTO> sessions) { this.sessions = sessions; }
}
