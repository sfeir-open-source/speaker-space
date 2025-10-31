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
public class Speaker {
    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String id;
    private String idConferenceHall;
    private String name;
    private String bio;
    private String company;
    private String references;
    private String picture;
    private String location;
    private String email;
    private List<String> socialLinks;
    private String eventId;
    private Date createdAt;
    private Date updatedAt;

    public Speaker() {
        Date now = new Date();
        this.createdAt = now;
        this.updatedAt = now;
    }
}
