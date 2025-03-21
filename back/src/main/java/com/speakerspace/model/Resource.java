package com.speakerspace.model;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @DocumentId
    private String idResource;
    private String title;
    private String description;
    private boolean isValidated;
}
