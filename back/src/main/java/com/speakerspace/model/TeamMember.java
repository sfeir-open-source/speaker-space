package com.speakerspace.model;

public class TeamMember {

    private String userId;
    private String role;
    private String email;
    private String status;
    private boolean isCreator;

    public TeamMember() {}

    public TeamMember(String userId, String role) {
        this.userId = userId;
        this.role = role;
    }

    public TeamMember(String userId, String role, String email, String status, boolean isCreator) {
        this.userId = userId;
        this.role = role;
        this.email = email;
        this.status = status;
        this.isCreator = isCreator;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isCreator() {
        return isCreator;
    }

    public void setCreator(boolean creator) {
        isCreator = creator;
    }
}
