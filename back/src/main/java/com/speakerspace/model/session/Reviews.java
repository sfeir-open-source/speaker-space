package com.speakerspace.model.session;

import com.google.cloud.spring.data.firestore.Document;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document
public class Reviews {

    private double average;
    private int positives;
    private int negatives;
}
