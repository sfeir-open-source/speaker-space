package com.speakerspace.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.common.primitives.Bytes;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Picture {
    @DocumentId
    private String idPicture;
    private String picture;
    private String title;
}
