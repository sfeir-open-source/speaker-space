package com.speakerspace.model;

import java.util.Objects;

public class User {
    private String uid;
    private String email;
    private String displayName;
    private String photoURL;
    private String company;
    private String city;
    private String phoneNumber;
    private String githubLink;
    private String twitterLink;
    private String blueSkyLink;
    private String linkedInLink;
    private String biography;
    private String otherLink;

    public User() {}

    public User(String uid, String email, String displayName, String photoURL, String company, String city, String phoneNumber, String githubLink, String twitterLink, String blueSkyLink, String linkedInLink, String biography, String otherLink) {
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.photoURL = photoURL;
        this.company = company;
        this.city = city;
        this.phoneNumber = phoneNumber;
        this.githubLink = githubLink;
        this.twitterLink = twitterLink;
        this.blueSkyLink = blueSkyLink;
        this.linkedInLink = linkedInLink;
        this.biography = biography;
        this.otherLink = otherLink;
    }

    public String getUid() {
        return uid;
    }

    public void setUid(String uid) {
        this.uid = uid;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPhotoURL() {
        return photoURL;
    }

    public void setPhotoURL(String photoURL) {
        this. photoURL= photoURL;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getGithubLink() {
        return githubLink;
    }

    public void setGithubLink(String githubLink) {
        this.githubLink = githubLink;
    }

    public String getTwitterLink() {
        return twitterLink;
    }

    public void setTwitterLink(String twitterLink) {
        this.twitterLink = twitterLink;
    }

    public String getBlueSkyLink() {
        return blueSkyLink;
    }

    public void setBlueSkyLink(String blueSkyLink) {
        this.blueSkyLink = blueSkyLink;
    }

    public String getLinkedInLink() {
        return linkedInLink;
    }

    public void setLinkedInLink(String linkedInLink) {
        this.linkedInLink = linkedInLink;
    }

    public String getBiography() {
        return biography;
    }

    public void setBiography(String biography) {
        this.biography = biography;
    }

    public String getOtherLink() {
        return otherLink;
    }

    public void setOtherLink(String otherLink) {
        this.otherLink = otherLink;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(uid, user.uid);
    }

    @Override
    public int hashCode() {
        return Objects.hash(uid);
    }
}
