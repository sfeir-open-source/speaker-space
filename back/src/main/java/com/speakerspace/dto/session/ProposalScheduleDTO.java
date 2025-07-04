package com.speakerspace.dto.session;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class ProposalScheduleDTO {
    private String id;

    @JsonProperty("abstract")
    private String abstractText;

    private String level;
    private List<String> formats;
    private List<String> categories;
    private List<SpeakerDTO> speakers;

    public ProposalScheduleDTO() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAbstractText() { return abstractText; }
    public void setAbstractText(String abstractText) { this.abstractText = abstractText; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public List<String> getFormats() { return formats; }
    public void setFormats(List<String> formats) { this.formats = formats; }

    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }

    public List<SpeakerDTO> getSpeakers() { return speakers; }
    public void setSpeakers(List<SpeakerDTO> speakers) { this.speakers = speakers; }
}