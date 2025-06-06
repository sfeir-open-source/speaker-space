package com.speakerspace.model.session;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

public class SessionImportData {

    private String id;
    private String title;

    @JsonProperty("abstract")
    private String abstractText;

    private String deliberationStatus;
    private String confirmationStatus;
    private String level;
    private String references;
    private String eventId;
    private List<Format> formats = new ArrayList<>();
    private List<Category> categories = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    private List<String> languages = new ArrayList<>();
    private List<Speaker> speakers = new ArrayList<>();
    private Reviews reviews;

    public SessionImportData() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAbstractText() { return abstractText; }
    public void setAbstractText(String abstractText) { this.abstractText = abstractText; }

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

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getReferences() { return references; }
    public void setReferences(String references) { this.references = references; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public List<Format> getFormats() { return formats; }
    public void setFormats(List<Format> formats) {
        this.formats = formats != null ? formats : new ArrayList<>();
    }

    public List<Category> getCategories() { return categories; }
    public void setCategories(List<Category> categories) {
        this.categories = categories != null ? categories : new ArrayList<>();
    }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) {
        this.tags = tags != null ? tags : new ArrayList<>();
    }

    public List<String> getLanguages() { return languages; }
    public void setLanguages(List<String> languages) {
        this.languages = languages != null ? languages : new ArrayList<>();
    }

    public List<Speaker> getSpeakers() { return speakers; }
    public void setSpeakers(List<Speaker> speakers) {
        this.speakers = speakers != null ? speakers : new ArrayList<>();
    }

    public Reviews getReviews() {
        return reviews;
    }

    public void setReviews(Reviews reviews) {
        this.reviews = reviews;
    }
}