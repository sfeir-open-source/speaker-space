package com.speakerspace.model;

import com.google.cloud.Timestamp;

public class Event {

    private String idEvent;
    private String eventName;
    private String description;
    private Timestamp startDate;
    private Timestamp endDate;
    private boolean isOnline;
    private String url;
    private String location;
    private boolean isPrivate;
    private String webLinkUrl;
    private boolean isFinish;
    private String userCreateId;
    private String conferenceHallUrl;
    private String teamId;
    private String timeZone;

    public Event() {
    }

    public Event(String idEvent, String eventName, String description, Timestamp startDate, Timestamp endDate, boolean isOnline, String location, boolean isPrivate, String webLinkUrl, boolean isFinish, String url, String userCreateId, String conferenceHallUrl, String teamId, String timeZone) {
        this.idEvent = idEvent;
        this.eventName = eventName;
        this.description = description;
        this.startDate = startDate;
        this.url = url;
        this.endDate = endDate;
        this.isOnline = isOnline;
        this.location = location;
        this.isPrivate = isPrivate;
        this.webLinkUrl = webLinkUrl;
        this.isFinish = isFinish;
        this.userCreateId = userCreateId;
        this.conferenceHallUrl = conferenceHallUrl;
        this.teamId = teamId;
        this.timeZone = timeZone;
    }

    public String getIdEvent() {
        return idEvent;
    }

    public void setIdEvent(String idEvent) {
        this.idEvent = idEvent;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Timestamp getStartDate() {
        return startDate;
    }

    public void setStartDate(Timestamp startDate) {
        this.startDate = startDate;
    }

    public Timestamp getEndDate() {
        return endDate;
    }

    public void setEndDate(Timestamp endDate) {
        this.endDate = endDate;
    }

    public boolean getIsOnline() {
        return isOnline;
    }

    public void setIsOnline(boolean isOnline) {
        this.isOnline = isOnline;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isPrivate() {
        return isPrivate;
    }

    public void setPrivate(boolean isPrivate) {
        this.isPrivate = isPrivate;
    }

    public String getWebLinkUrl() {
        return webLinkUrl;
    }

    public void setWebLinkUrl(String webLinkUrl) {
        this.webLinkUrl = webLinkUrl;
    }

    public boolean isFinish() {
        return isFinish;
    }

    public void setFinish(boolean finish) {
        isFinish = finish;
    }

    public String getUserCreateId() {
        return userCreateId;
    }

    public void setUserCreateId(String userCreateId) {
        this.userCreateId = userCreateId;
    }

    public String getConferenceHallUrl() {
        return conferenceHallUrl;
    }

    public void setConferenceHallUrl(String conferenceHallUrl) {
        this.conferenceHallUrl = conferenceHallUrl;
    }

    public String getTeamId() {
        return teamId;
    }

    public void setTeamId(String teamId) {
        this.teamId = teamId;
    }

    public String getTimeZone() {
        return timeZone;
    }

    public void setTimeZone(String timeZone) {
        this.timeZone = timeZone;
    }
}
