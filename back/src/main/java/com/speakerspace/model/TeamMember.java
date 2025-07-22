package com.speakerspace.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamMember {

    private String userId;
    private String role;
    private String displayName;
    private String email;
    private String photoURL;
    private String status;
    private Boolean isCreator;

    public TeamMember() {}

    public TeamMember(String userId, String role) {
        this.userId = userId;
        this.role = role;
    }
}
