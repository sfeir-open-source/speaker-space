package com.speakerspace.dto;

public class EventDTO {
    private String idEvent;
    private String eventName;
    private String description;
    private String endDate;
    private String url;
    private String startDate;
    private Boolean isOnline;
    private String location;
    private boolean isPrivate;
    private String webLinkUrl;
    private boolean isFinish;
    private String userCreateId;
    private String conferenceHallUrl;
    private String teamId;
    private String timeZone;
    private String logoBase64;


    public EventDTO(String idEvent, String eventName, String description, String startDate, String endDate, boolean isOnline, String location, boolean isPrivate, String webLinkUrl, boolean isFinish, String url, String userCreateId, String conferenceHallUrl, String teamId, String timeZone, String logoBase64) {
        this.idEvent = idEvent;
        this.eventName = eventName;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.isOnline = isOnline;
        this.location = location;
        this.isPrivate = isPrivate;
        this.webLinkUrl = webLinkUrl;
        this.isFinish = isFinish;
        this.url = url;
        this.conferenceHallUrl = conferenceHallUrl;
        this.userCreateId = userCreateId;
        this.teamId = teamId;
        this.timeZone = timeZone;
        this.logoBase64 = logoBase64;
    }

    public EventDTO() {

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

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public Boolean getIsOnline() {
        return isOnline;
    }

    public void setIsOnline(Boolean isOnline) {
        this.isOnline = isOnline;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Boolean getIsPrivate() {
        return isPrivate;
    }

    public void setPrivate(Boolean isPrivate) {
        this.isPrivate = isPrivate;
    }

    public Boolean isFinish() {
        return isFinish;
    }

    public void setFinish(Boolean isFinish) {
        this.isFinish = isFinish;
    }

    public String getWebLinkUrl() {
        return webLinkUrl;
    }

    public void setWebLinkUrl(String webLinkUrl) {
        this.webLinkUrl = webLinkUrl;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
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

    public String getLogoBase64() {
        return logoBase64;
    }

    public void setLogoBase64(String logoBase64) {
        this.logoBase64 = logoBase64;
    }
}
