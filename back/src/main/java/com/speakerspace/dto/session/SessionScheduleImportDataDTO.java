package com.speakerspace.dto.session;

import java.util.Date;

public class SessionScheduleImportDataDTO {
    private String id;
    private Date start;
    private Date end;
    private String track;
    private String title;
    private String languages;
    private ProposalScheduleDTO proposal;
    private String eventId;

    public SessionScheduleImportDataDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Date getStart() { return start; }
    public void setStart(Date start) { this.start = start; }

    public Date getEnd() { return end; }
    public void setEnd(Date end) { this.end = end; }

    public String getTrack() { return track; }
    public void setTrack(String track) { this.track = track; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }

    public ProposalScheduleDTO getProposal() { return proposal; }
    public void setProposal(ProposalScheduleDTO proposal) { this.proposal = proposal; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
}

