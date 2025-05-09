package com.speakerspace.dto;

import com.google.cloud.Timestamp;

public class EventDTO {
    private String idEvent;
    private String eventName;
    private String description;
    private Timestamp startDate;
    private String url;
    private Timestamp endDate;
    private boolean isOnline;
    private String location;
    private boolean isPrivate;
    private String webLinkUrl;
    private boolean isFinish;

    public EventDTO(String idEvent, String eventName, String description, Timestamp startDate, Timestamp endDate, boolean isOnline, String location, boolean isPrivate, String webLinkUrl, boolean isFinish, String url) {
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

    public boolean isOnline() {
        return isOnline;
    }

    public void setOnline(boolean online) {
        isOnline = online;
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

    public void setPrivate(boolean aPrivate) {
        isPrivate = aPrivate;
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

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
