package com.speakerspace.dto.session;

import java.util.Date;
import java.util.List;

public class SessionDTO {

    private String id;
    private String title;
    private String abstractText;
    private String deliberationStatus;
    private String confirmationStatus;
    private String level;
    private String references;
    private List<FormatDTO> formats;
    private List<CategoryDTO> categories;
    private List<String> tags;
    private List<String> languages;
    private List<SpeakerDTO> speakers;
    private ReviewDTO reviews;
    private String eventId;
    private Date start;
    private Date end;
    private String track;

    public SessionDTO() {}

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAbstractText() {
        return abstractText;
    }

    public void setAbstractText(String abstractText) {
        this.abstractText = abstractText;
    }

    public String getDeliberationStatus() {
        return deliberationStatus;
    }

    public void setDeliberationStatus(String deliberationStatus) {
        this.deliberationStatus = deliberationStatus;
    }

    public String getConfirmationStatus() {
        return confirmationStatus;
    }

    public void setConfirmationStatus(String confirmationStatus) {
        this.confirmationStatus = confirmationStatus;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getReferences() {
        return references;
    }

    public void setReferences(String references) {
        this.references = references;
    }

    public List<FormatDTO> getFormats() {
        return formats;
    }

    public void setFormats(List<FormatDTO> formats) {
        this.formats = formats;
    }

    public List<CategoryDTO> getCategories() {
        return categories;
    }

    public void setCategories(List<CategoryDTO> categories) {
        this.categories = categories;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public List<String> getLanguages() {
        return languages;
    }

    public void setLanguages(List<String> languages) {
        this.languages = languages;
    }

    public List<SpeakerDTO> getSpeakers() {
        return speakers;
    }

    public void setSpeakers(List<SpeakerDTO> speakers) {
        this.speakers = speakers;
    }

    public ReviewDTO getReviews() {
        return reviews;
    }

    public void setReviews(ReviewDTO reviews) {
        this.reviews = reviews;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
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