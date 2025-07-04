package com.speakerspace.dto.session;

import java.util.List;

public class SessionReviewImportRequestDTO {
    private String eventId;
    private List<SessionDTO> sessions;

    public SessionReviewImportRequestDTO() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public List<SessionDTO> getSessions() { return sessions; }
    public void setSessions(List<SessionDTO> sessions) { this.sessions = sessions; }
}
