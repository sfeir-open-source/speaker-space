package com.speakerspace.model;

import java.util.ArrayList;
import java.util.List;

public class Team {
    private String id;
    private String name;
    private String url;
    private String userCreateId;
    private List<String> memberIds;

    public Team() {
    }

    public Team(String id, String name, String url, String userCreateId, List<String> memberIds) {
        this.id = id;
        this.name = name;
        this.url = url;
        this.userCreateId = userCreateId;
        this.memberIds = memberIds;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getUserCreateId() {
        return userCreateId;
    }

    public void setUserCreateId(String userCreateId) {
        this.userCreateId = userCreateId;
    }

    public List<String> getMemberIds() {
        return memberIds;
    }

    public void setMemberIds(List<String> memberIds) {
        this.memberIds = memberIds;
    }

    public void addMember(String memberId) {
        if (this.memberIds == null) {
            this.memberIds = new ArrayList<>();
        }
        if (!this.memberIds.contains(memberId)) {
            this.memberIds.add(memberId);
        }
    }
}