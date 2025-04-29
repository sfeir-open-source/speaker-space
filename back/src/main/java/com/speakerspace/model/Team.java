package com.speakerspace.model;

import java.util.ArrayList;
import java.util.List;

public class Team {
    private String id;
    private String name;
    private String url;
    private String userCreateId;
    private List<String> memberIds;
    private List<TeamMember> members;

    public Team(String id, String name, String url, String userCreateId, List<String> memberIds) {
        this.id = id;
        this.name = name;
        this.url = url;
        this.userCreateId = userCreateId;
        this.memberIds = memberIds;
    }

    public Team() {
        this.memberIds = new ArrayList<>();
        this.members = new ArrayList<>();
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

    public List<TeamMember> getMembers() {
        return members;
    }

    public void setMembers(List<TeamMember> members) {
        this.members = members;
    }

    public void addMember(String userId) {
        if (memberIds == null) {
            memberIds = new ArrayList<>();
        }
        if (!memberIds.contains(userId)) {
            memberIds.add(userId);
        }

        addMemberWithRole(userId, "Owner");
    }

    public void addMemberWithRole(String userId, String role) {
        if (memberIds == null) {
            memberIds = new ArrayList<>();
        }
        if (!memberIds.contains(userId)) {
            memberIds.add(userId);
        }

        if (members == null) {
            members = new ArrayList<>();
        }

        boolean memberExists = false;
        for (TeamMember member : members) {
            if (member.getUserId().equals(userId)) {
                member.setRole(role);
                memberExists = true;
                break;
            }
        }

        if (!memberExists) {
            members.add(new TeamMember(userId, role));
        }
    }

    public void removeMember(String userId) {
        if (memberIds != null) {
            memberIds.remove(userId);
        }

        if (members != null) {
            members.removeIf(member -> member.getUserId().equals(userId));
        }
    }

    public void updateMemberRole(String userId, String newRole) {
        if (members != null) {
            for (TeamMember member : members) {
                if (member.getUserId().equals(userId)) {
                    member.setRole(newRole);
                    break;
                }
            }
        }
    }
}