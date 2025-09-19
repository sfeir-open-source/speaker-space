package com.speakerspace.model.session;

import com.google.cloud.spring.data.firestore.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@Document
public class Session {
    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String id;
    private Date start;
    private Date end;
    private String track;
    private String title;
    private String abstractText;
    private String deliberationStatus;
    private String confirmationStatus;
    private String level;
    private String references;
    private List<Format> formats;
    private List<Category> categories;
    private List<String> tags;
    private List<String> languages;
    private List<String> speakerIds;
    private Reviews reviews;
    private String eventId;
    private Date createdAt;
    private Date updatedAt;

    public Session() {
        Date now = new Date();
        this.createdAt = now;
        this.updatedAt = now;
    }
}
