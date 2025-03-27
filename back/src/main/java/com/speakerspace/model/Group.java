package com.speakerspace.model;

import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Group {

    @DocumentId
    private String idGroup;
    private String title;
    private String description;

    @PropertyName("faq")
    private List<UserGroup> users;


    private List<String> events;
}
