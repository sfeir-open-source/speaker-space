package com.speakerspace.dto.session;

import java.util.List;

public class SpeakerScheduleDTO {
    private String id;
    private String name;
    private String bio;
    private String company;
    private String picture;
    private List<String> socialLinks;

    public SpeakerScheduleDTO() {}

    // Getters et setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }

    public List<String> getSocialLinks() { return socialLinks; }
    public void setSocialLinks(List<String> socialLinks) { this.socialLinks = socialLinks; }
}