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
    private Boolean online;
    private String url;
    private String location;
    private Boolean privateEvent;
    private String webLinkUrl;
    private Boolean finished;
    private String userCreateId;
    private String conferenceHallUrl;
    private String teamId;
    private String timeZone;
    private String logoBase64;
    private String type;

    public Event() {
        this.online = false;
        this.privateEvent = true;
        this.finished = false;
    }

    public Boolean getOnline() {
        return online != null ? online : false;
    }

    public void setOnline(Boolean online) {
        this.online = online != null ? online : false;
    }

    public Boolean getPrivateEvent() {
        return privateEvent != null ? privateEvent : true;
    }

    public void setPrivateEvent(Boolean privateEvent) {
        this.privateEvent = privateEvent != null ? privateEvent : true;
    }

    public Boolean getFinished() {
        return finished != null ? finished : false;
    }

    public void setFinished(Boolean finished) {
        this.finished = finished != null ? finished : false;
    }
}
