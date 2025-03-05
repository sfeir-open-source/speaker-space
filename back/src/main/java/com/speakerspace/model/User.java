package com.speakerspace.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;
import com.google.common.primitives.Bytes;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.intellij.lang.annotations.Pattern;

import javax.annotation.Nullable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @DocumentId
    private String idUser;
    private String firstname;
    private String lastname;
    private String email;
    private String password;
    private @Nullable String picture;
    private Timestamp createDate;
    private @Nullable String country;
    private @Nullable String company;
    private @Nullable String biography;
    private @Nullable String phone;
    private @Nullable Timestamp birthday;
    private @Nullable String ticket;

    @PropertyName("social_networks")
    private List<SocialNetwork> socialNetworks;

    @PropertyName("travel_documents")
    private List<TravelDocument> travelDocuments;

    private List<String> groups;
    private List<String> events;
    private List<String> travels;
    private List<String> sessions;
    private List<String> tasks;

    public String getIdUser() {
        return idUser;
    }

    public void setIdUser(String idUser) {
        this.idUser = idUser;
    }

    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    @Nullable
    public String getPicture() {
        return picture;
    }

    public void setPicture(@Nullable String picture) {
        this.picture = picture;
    }

    public Timestamp getCreateDate() {
        return createDate;
    }

    public void setCreateDate(Timestamp createDate) {
        this.createDate = createDate;
    }

    @Nullable
    public String getCountry() {
        return country;
    }

    public void setCountry(@Nullable String country) {
        this.country = country;
    }

    @Nullable
    public String getCompany() {
        return company;
    }

    public void setCompany(@Nullable String company) {
        this.company = company;
    }

    @Nullable
    public String getBiography() {
        return biography;
    }

    public void setBiography(@Nullable String biography) {
        this.biography = biography;
    }

    @Nullable
    public String getPhone() {
        return phone;
    }

    public void setPhone(@Nullable String phone) {
        this.phone = phone;
    }

    @Nullable
    public Timestamp getBirthday() {
        return birthday;
    }

    public void setBirthday(@Nullable Timestamp birthday) {
        this.birthday = birthday;
    }

    @Nullable
    public String getTicket() {
        return ticket;
    }

    public void setTicket(@Nullable String ticket) {
        this.ticket = ticket;
    }

    public List<SocialNetwork> getSocialNetworks() {
        return socialNetworks;
    }

    public void setSocialNetworks(List<SocialNetwork> socialNetworks) {
        this.socialNetworks = socialNetworks;
    }

    public List<TravelDocument> getTravelDocuments() {
        return travelDocuments;
    }

    public void setTravelDocuments(List<TravelDocument> travelDocuments) {
        this.travelDocuments = travelDocuments;
    }

    public List<String> getGroups() {
        return groups;
    }

    public void setGroups(List<String> groups) {
        this.groups = groups;
    }

    public List<String> getEvents() {
        return events;
    }

    public void setEvents(List<String> events) {
        this.events = events;
    }

    public List<String> getTravels() {
        return travels;
    }

    public void setTravels(List<String> travels) {
        this.travels = travels;
    }

    public List<String> getSessions() {
        return sessions;
    }

    public void setSessions(List<String> sessions) {
        this.sessions = sessions;
    }

    public List<String> getTasks() {
        return tasks;
    }

    public void setTasks(List<String> tasks) {
        this.tasks = tasks;
    }
}
