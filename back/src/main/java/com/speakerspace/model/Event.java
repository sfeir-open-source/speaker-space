package com.speakerspace.model;

import com.google.cloud.Timestamp;
import com.google.cloud.spring.data.firestore.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@Document
public class Event {

    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String idEvent;
    private String eventName;
    private String description;
    private Timestamp startDate;
    private Timestamp endDate;
    private Boolean isOnline;
    private String url;
    private String location;
    private Boolean isPrivate;
    private String webLinkUrl;
    private Boolean isFinish;
    private String userCreateId;
    private String conferenceHallUrl;
    private String teamId;
    private String timeZone;
    private String logoBase64;
    private String type;

    public Event() {
        this.isOnline = false;
        this.isPrivate = true;
        this.isFinish = false;
    }

    public Boolean getIsOnline() {
        return isOnline != null ? isOnline : false;
    }

    public void setIsOnline(Boolean isOnline) {
        this.isOnline = isOnline != null ? isOnline : false;
    }

    public Boolean isPrivate() { return isPrivate; }
    public void setPrivate(Boolean isPrivate) { this.isPrivate = isPrivate; }

    public Boolean isFinish() { return isFinish; }
    public void setFinish(Boolean isFinish) { this.isFinish = isFinish; }
}
