package com.speakerspace.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.annotation.Nullable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Travel {

    @DocumentId
    private String idTravel;
    private String title;
    private boolean isOrganizedBySpeaker;
    private @Nullable String description;
    private @Nullable Timestamp travelDate;
    private boolean isValidated;
    private String organizerResponse;
    private boolean isFinished;

    @PropertyName("travel_type")
    private List<TravelType> travelType;

    @PropertyName("proof")
    private List<Proof> proofs;

    private String userId;
    private String eventId;
}
