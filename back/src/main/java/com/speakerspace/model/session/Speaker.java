package com.speakerspace.model.session;

import java.util.List;

public class Speaker {

    private String name;
    private String bio;
    private String company;
    private String references;
    private String picture;
    private String location;
    private String email;
    private List<String> socialLinks;

    public Speaker(String name, String bio, String company, String references, String picture, String location, String email, List<String> socialLinks) {
        this.name = name;
        this.bio = bio;
        this.company = company;
        this.references = references;
        this.picture = picture;
        this.location = location;
        this.email = email;
        this.socialLinks = socialLinks;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getReferences() {
        return references;
    }

    public void setReferences(String references) {
        this.references = references;
    }

    public String getPicture() {
        return picture;
    }

    public void setPicture(String picture) {
        this.picture = picture;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getSocialLinks() {
        return socialLinks;
    }

    public void setSocialLinks(List<String> socialLinks) {
        this.socialLinks = socialLinks;
    }
}
