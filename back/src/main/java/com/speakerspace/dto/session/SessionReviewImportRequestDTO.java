package com.speakerspace.dto.session;

import java.util.List;

public class SessionReviewImportRequestDTO {
    private String eventId;
    private List<SessionReviewImportDataDTO> sessions;

    public SessionReviewImportRequestDTO() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public List<SessionReviewImportDataDTO> getSessions() { return sessions; }
    public void setSessions(List<SessionReviewImportDataDTO> sessions) { this.sessions = sessions; }
}
