package com.speakerspace.model.session;

import com.google.cloud.spring.data.firestore.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@Document
public class Category {
    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String id;
    private String name;
    private String description;
}
