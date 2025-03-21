package com.speakerspace.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.common.primitives.Bytes;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.annotation.Nullable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Proof {

    @DocumentId
    private String idProof;
    private String title;
    private @Nullable String description;
    private String picture;
}
