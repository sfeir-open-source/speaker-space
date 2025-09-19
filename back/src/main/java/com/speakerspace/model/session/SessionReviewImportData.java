package com.speakerspace.model.session;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.cloud.spring.data.firestore.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@Document
public class SessionReviewImportData {

    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String id;
    private String title;

    @JsonProperty("abstract")
    private String abstractText;

    private String deliberationStatus;
    private String confirmationStatus;
    private String level;
    private String references;
    private String eventId;
    private List<Format> formats = new ArrayList<>();
    private List<Category> categories = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    private List<String> languages = new ArrayList<>();
    private List<Speaker> speakers = new ArrayList<>();
    private Reviews reviews;
}