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
public class Event {

    @DocumentId
    private String idEvent;
    private String eventName;
    private @Nullable String description;
    private Timestamp startDate;
    private Timestamp endDate;
    private String road;
    private String zipCode;
    private String city;
    private boolean isPrivate;
    private @Nullable String webLinkUrl;
    private String contactEmail;
    private boolean isFinish;

    @PropertyName("faq")
    private List<Faq> faqs;

    @PropertyName("picture")
    private List<Picture> pictures;

    private List<String> organizers;
    private List<String> sessions;
    private List<String> groups;
    private List<String> travels;
}
