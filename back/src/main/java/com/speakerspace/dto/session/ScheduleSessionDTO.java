package com.speakerspace.dto.session;

import java.util.Date;

public class ScheduleSessionDTO {
    private String id;
    private Date start;
    private Date end;
    private String track;
    private String title;
    private String language;
    private ProposalDTO proposal;

    public ScheduleSessionDTO() {}

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

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public ProposalDTO getProposal() { return proposal; }
    public void setProposal(ProposalDTO proposal) { this.proposal = proposal; }
}
