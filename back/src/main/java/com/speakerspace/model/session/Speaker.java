package com.speakerspace.model.session;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
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
