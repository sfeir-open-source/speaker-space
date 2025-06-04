package com.speakerspace.model.session;

import java.util.List;

public class Session {
    private String id;
    private String title;
    private String abstractText;
    private boolean deliberationStatus;
    private boolean confirmationStatus;
    private String level;
    private String references;
    private List<Format> formats;
    private List<Category> categories;
    private List<String> tags;
    private List<String> languages;
    private List<Speaker> speakers;
    private Reviews reviews;
    private String eventId;

    public Session(String id, String title, String abstractText, boolean deliberationStatus, boolean confirmationStatus, String level, String references, List<Format> formats, List<Category> categories, List<String> tags, List<String> languages, List<Speaker> speakers, Reviews reviews, String eventId) {
        this.id = id;
        this.title = title;
        this.abstractText = abstractText;
        this.deliberationStatus = deliberationStatus;
        this.confirmationStatus = confirmationStatus;
        this.level = level;
        this.references = references;
        this.formats = formats;
        this.categories = categories;
        this.tags = tags;
        this.languages = languages;
        this.speakers = speakers;
        this.reviews = reviews;
        this.eventId = eventId;
    }

    public Session() {

    }

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

    public boolean isDeliberationStatus() {
        return deliberationStatus;
    }

    public void setDeliberationStatus(boolean deliberationStatus) {
        this.deliberationStatus = deliberationStatus;
    }

    public boolean isConfirmationStatus() {
        return confirmationStatus;
    }

    public void setConfirmationStatus(boolean confirmationStatus) {
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

    public List<Format> getFormats() {
        return formats;
    }

    public void setFormats(List<Format> formats) {
        this.formats = formats;
    }

    public List<Category> getCategories() {
        return categories;
    }

    public void setCategories(List<Category> categories) {
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

    public List<Speaker> getSpeakers() {
        return speakers;
    }

    public void setSpeakers(List<Speaker> speakers) {
        this.speakers = speakers;
    }

    public Reviews getReviews() {
        return reviews;
    }

    public void setReviews(Reviews reviews) {
        this.reviews = reviews;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }
}
