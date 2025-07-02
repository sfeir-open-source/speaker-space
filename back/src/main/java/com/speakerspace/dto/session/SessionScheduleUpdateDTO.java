package com.speakerspace.dto.session;

import java.util.Date;

public class SessionScheduleUpdateDTO {

    private Date start;
    private Date end;
    private String track;

    public SessionScheduleUpdateDTO() {}

    public SessionScheduleUpdateDTO(Date start, Date end, String track) {
        this.start = start;
        this.end = end;
        this.track = track;
    }

    public Date getStart() {
        return start;
    }

    public void setStart(Date start) {
        this.start = start;
    }

    public Date getEnd() {
        return end;
    }

    public void setEnd(Date end) {
        this.end = end;
    }

    public String getTrack() {
        return track;
    }

    public void setTrack(String track) {
        this.track = track;
    }
}