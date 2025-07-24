package com.speakerspace.model;

import com.google.cloud.spring.data.firestore.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@Document
public class Team {
    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
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
        this.invitedEmails = new HashMap<>();
    }

    public List<String> getMemberIds() {
        return memberIds != null ? memberIds : new ArrayList<>();
    }

    public void setMemberIds(List<String> memberIds) {
        this.memberIds = memberIds != null ? new ArrayList<>(memberIds) : new ArrayList<>();
    }

    public List<TeamMember> getMembers() {
        return members != null ? members : new ArrayList<>();
    }

    public void setMembers(List<TeamMember> members) {
        this.members = members != null ? new ArrayList<>(members) : new ArrayList<>();
    }

    public Map<String, String> getInvitedEmails() {
        return invitedEmails != null ? invitedEmails : new HashMap<>();
    }

    public void addMember(String userId) {
        ensureMutableCollections();

        if (!memberIds.contains(userId)) {
            memberIds.add(userId);
        }
        addMemberWithRole(userId, "Owner", true);
    }

    public void addMemberWithRole(String userId, String role, boolean isCreator) {
        ensureMutableCollections();

        if (!memberIds.contains(userId)) {
            memberIds.add(userId);
        }

        TeamMember existingMember = members.stream()
                .filter(member -> member.getUserId().equals(userId))
                .findFirst()
                .orElse(null);

        if (existingMember != null) {
            existingMember.setRole(role);
            existingMember.setIsCreator(isCreator);
        } else {
            TeamMember newMember = new TeamMember(userId, role);
            newMember.setIsCreator(isCreator);
            newMember.setStatus("active");
            members.add(newMember);
        }
    }

    public void addMemberWithRole(String userId, String role) {
        addMemberWithRole(userId, role, false);
    }

    public void removeMember(String userId) {
        ensureMutableCollections();

        memberIds.remove(userId);
        members.removeIf(member -> member.getUserId().equals(userId));
    }

    public void updateMemberRole(String userId, String newRole) {
        ensureMutableCollections();

        members.stream()
                .filter(member -> member.getUserId().equals(userId))
                .findFirst()
                .ifPresent(member -> member.setRole(newRole));
    }

    public void addInvitedEmail(String email, String temporaryUserId) {
        ensureMutableCollections();
        invitedEmails.put(email, temporaryUserId);
    }

    public String getTemporaryUserIdByEmail(String email) {
        return invitedEmails.get(email);
    }

    public void removeInvitedEmail(String email) {
        ensureMutableCollections();
        invitedEmails.remove(email);
    }

    public void updateMemberId(String oldId, String newId) {
        ensureMutableCollections();

        members.stream()
                .filter(member -> member.getUserId().equals(oldId))
                .findFirst()
                .ifPresent(member -> member.setUserId(newId));

        for (int i = 0; i < memberIds.size(); i++) {
            if (memberIds.get(i).equals(oldId)) {
                memberIds.set(i, newId);
                break;
            }
        }
    }

    private void ensureMutableCollections() {
        if (memberIds == null) {
            memberIds = new ArrayList<>();
        } else if (!(memberIds instanceof ArrayList)) {
            memberIds = new ArrayList<>(memberIds);
        }

        if (members == null) {
            members = new ArrayList<>();
        } else if (!(members instanceof ArrayList)) {
            members = new ArrayList<>(members);
        }

        if (invitedEmails == null) {
            invitedEmails = new HashMap<>();
        } else if (!(invitedEmails instanceof HashMap)) {
            invitedEmails = new HashMap<>(invitedEmails);
        }
    }
}
