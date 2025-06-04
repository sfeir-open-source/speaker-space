package com.speakerspace.dto.session;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SessionImportDTO {

    @JsonProperty("id")
    private String id;

    @JsonProperty("title")
    @NotBlank(message = "Title is required")
    private String title;

    @JsonProperty("abstract")
    private String sessionAbstract;

    @JsonProperty("deliberationStatus")
    private Boolean deliberationStatus;

    @JsonProperty("confirmationStatus")
    private Boolean confirmationStatus;

    @JsonProperty("level")
    private String level;

    @JsonProperty("references")
    private String references;

    @JsonProperty("formats")
    private String formats;

    @JsonProperty("categories")
    private String categories;

    @JsonProperty("tags")
    private String tags;

    @JsonProperty("languages")
    private String languages;

    @JsonProperty("speakers")
    private String speakers;

    @JsonProperty("reviews")
    private String reviews;

    public SessionImportDTO(String reviews, String speakers, String languages, String tags, String categories, String formats, String references, String level, Boolean confirmationStatus, Boolean deliberationStatus, String sessionAbstract, String title, String id) {
        this.reviews = reviews;
        this.speakers = speakers;
        this.languages = languages;
        this.tags = tags;
        this.categories = categories;
        this.formats = formats;
        this.references = references;
        this.level = level;
        this.confirmationStatus = confirmationStatus;
        this.deliberationStatus = deliberationStatus;
        this.sessionAbstract = sessionAbstract;
        this.title = title;
        this.id = id;
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

    public String getSessionAbstract() {
        return sessionAbstract;
    }

    public void setSessionAbstract(String sessionAbstract) {
        this.sessionAbstract = sessionAbstract;
    }

    public Boolean getDeliberationStatus() {
        return deliberationStatus;
    }

    public void setDeliberationStatus(Boolean deliberationStatus) {
        this.deliberationStatus = deliberationStatus;
    }

    public Boolean getConfirmationStatus() {
        return confirmationStatus;
    }

    public void setConfirmationStatus(Boolean confirmationStatus) {
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

    public String getFormats() {
        return formats;
    }

    public void setFormats(String formats) {
        this.formats = formats;
    }

    public String getCategories() {
        return categories;
    }

    public void setCategories(String categories) {
        this.categories = categories;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public String getLanguages() {
        return languages;
    }

    public void setLanguages(String languages) {
        this.languages = languages;
    }

    public String getSpeakers() {
        return speakers;
    }

    public void setSpeakers(String speakers) {
        this.speakers = speakers;
    }

    public String getReviews() {
        return reviews;
    }

    public void setReviews(String reviews) {
        this.reviews = reviews;
    }
}