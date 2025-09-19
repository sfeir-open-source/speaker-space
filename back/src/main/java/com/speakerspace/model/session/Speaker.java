package com.speakerspace.model.session;

import com.google.cloud.spring.data.firestore.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@Document
public class Speaker {

    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String id;
    private String name;
    private String bio;
    private String company;
    private String references;
    private String picture;
    private String location;
    private String email;
    private List<String> socialLinks;
    private String eventId;
}
