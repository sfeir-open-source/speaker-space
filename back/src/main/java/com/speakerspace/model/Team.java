package com.speakerspace.model;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Team {
    private String id;
    private String name;
    private String url;
    private String userCreateId;
    private String creatorEmail;
    private List<String> memberIds;
    private List<TeamMember> members;
    private Map<String, String> invitedEmails;

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

    public Map<String, String> getInvitedEmails() {
        return invitedEmails;
    }

    public void setInvitedEmails(Map<String, String> invitedEmails) {
        this.invitedEmails = invitedEmails;
    }

    public String getCreatorEmail() {
        return creatorEmail;
    }

    public void setCreatorEmail(String creatorEmail) {
        this.creatorEmail = creatorEmail;
    }

    public void addMember(String userId) {
        if (memberIds == null) {
            memberIds = new ArrayList<>();
        }
        if (!memberIds.contains(userId)) {
            memberIds.add(userId);
        }

        addMemberWithRole(userId, "Owner", true);
    }

    public void addMemberWithRole(String userId, String role, boolean isCreator) {
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
                member.setCreator(isCreator);
                memberExists = true;
                break;
            }
        }

        if (!memberExists) {
            TeamMember newMember = new TeamMember(userId, role);
            newMember.setCreator(isCreator);
            newMember.setStatus("active");
            members.add(newMember);
        }
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
            TeamMember newMember = new TeamMember(userId, role);
            newMember.setStatus("active");
            members.add(newMember);
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

    public void addInvitedEmail(String email, String temporaryUserId) {
        if (invitedEmails == null) {
            invitedEmails = new HashMap<>();
        }
        invitedEmails.put(email, temporaryUserId);
    }

    public String getTemporaryUserIdByEmail(String email) {
        return invitedEmails != null ? invitedEmails.get(email) : null;
    }

    public void removeInvitedEmail(String email) {
        if (invitedEmails != null) {
            invitedEmails.remove(email);
        }
    }

    public void updateMemberId(String oldId, String newId) {
        if (members != null) {
            for (TeamMember member : members) {
                if (member.getUserId().equals(oldId)) {
                    member.setUserId(newId);
                }
            }
        }

        if (memberIds != null) {
            List<String> updatedMemberIds = new ArrayList<>();
            for (String id : memberIds) {
                updatedMemberIds.add(id.equals(oldId) ? newId : id);
            }
            memberIds = updatedMemberIds;
        }
    }

}