package com.speakerspace.dto.session;

import java.util.List;

public class SessionScheduleImportRequestDTO {
    private String eventId;
    private List<SessionScheduleImportDataDTO> sessions;

    public SessionScheduleImportRequestDTO() {}

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public List<SessionScheduleImportDataDTO> getSessions() { return sessions; }
    public void setSessions(List<SessionScheduleImportDataDTO> sessions) { this.sessions = sessions; }
}
