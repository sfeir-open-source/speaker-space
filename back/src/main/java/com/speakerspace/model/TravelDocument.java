package com.speakerspace.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class TravelDocument {

    @DocumentId
    private String numberDocument;
    private Timestamp issueDate;
    private String username;
    private String firstnameInUse;
    private Timestamp expiryDate;
    private String issuingCountry;
    private String nationality;
    private Timestamp birthday;
    private String documentType;
    private String gender;
}
