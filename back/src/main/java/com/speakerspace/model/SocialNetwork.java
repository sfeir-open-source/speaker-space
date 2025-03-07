package com.speakerspace.model;

import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class SocialNetwork {

    @DocumentId
    private String socialNetwork;
    private String url;

}
