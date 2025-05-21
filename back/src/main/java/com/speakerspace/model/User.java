package com.speakerspace.model;

import com.google.cloud.firestore.annotation.PropertyName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.util.Objects;

public class User {

    @NotBlank(message = "User ID is required")
    private String uid;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 2, message = "Display name must be at least 2 characters")
    @PropertyName("display_name")
    private String displayName;

    @Size(min = 2, message = "Company name must be at least 2 characters if provided")
    private String company;

    @Size(min = 2, message = "City must be at least 2 characters if provided")
    private String city;

    @URL(message = "Invalid photo URL format")
    @PropertyName("photo_url")
    private String photoURL;

    @Pattern(regexp = "^(\\+?[0-9\\s.-]{6,})?$", message = "Invalid phone number format")
    @PropertyName("phone_number")
    private String phoneNumber;

    private String biography;

    @URL(message = "Invalid GitHub URL format")
    @PropertyName("github_link")
    private String githubLink;

    @URL(message = "Invalid Twitter URL format")
    @PropertyName("twitter_link")
    private String twitterLink;

    @URL(message = "Invalid BlueSky URL format")
    @PropertyName("bluesky_link")
    private String blueSkyLink;

    @URL(message = "Invalid LinkedIn URL format")
    @PropertyName("linkedin_link")
    private String linkedInLink;

    @URL(message = "Invalid URL format")
    @PropertyName("other_link")
    private String otherLink;

    public User() {}

    public User(String uid, String email, String displayName, String company, String city,
                String photoURL, String phoneNumber, String biography, String githubLink,
                String twitterLink, String blueSkyLink, String linkedInLink, String otherLink) {
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.company = company;
        this.city = city;
        this.photoURL = photoURL;
        this.phoneNumber = phoneNumber;
        this.biography = biography;
        this.githubLink = githubLink;
        this.twitterLink = twitterLink;
        this.blueSkyLink = blueSkyLink;
        this.linkedInLink = linkedInLink;
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

    public String getPhotoURL() {
        return photoURL;
    }

    public void setPhotoURL(String photoURL) {
        this.photoURL = photoURL;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getBiography() {
        return biography;
    }

    public void setBiography(String biography) {
        this.biography = biography;
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
    public String toString() {
        return "User{" +
                "uid='" + uid + '\'' +
                ", email='" + email + '\'' +
                ", displayName='" + displayName + '\'' +
                ", company='" + company + '\'' +
                ", city='" + city + '\'' +
                '}';
    }
}