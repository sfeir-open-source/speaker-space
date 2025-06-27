package com.speakerspace.dto.session;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.speakerspace.model.session.Category;
import com.speakerspace.model.session.Format;
import com.speakerspace.model.session.Speaker;

import java.util.ArrayList;
import java.util.List;

public class ProposalDTO {

    private String id;

    @JsonProperty("abstract")
    private String abstractText;
    private String level;
    private List<Format> formats = new ArrayList<>();
    private List<Category> categories = new ArrayList<>();
    private List<Speaker> speakers = new ArrayList<>();

    public ProposalDTO() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAbstractText() {
        return abstractText;
    }

    public void setAbstractText(String abstractText) {
        this.abstractText = abstractText;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
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

    public List<Speaker> getSpeakers() {
        return speakers;
    }

    public void setSpeakers(List<Speaker> speakers) {
        this.speakers = speakers;
    }
}
