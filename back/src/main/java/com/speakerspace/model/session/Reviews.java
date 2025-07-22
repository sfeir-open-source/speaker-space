package com.speakerspace.model.session;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Reviews {

    private double average;
    private int positives;
    private int negatives;
}
