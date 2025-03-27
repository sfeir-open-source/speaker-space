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
public class Session {

    @DocumentId
    private String idSession;
    private String title;
    private String description;
    private Timestamp startDate;
    private @Nullable Timestamp endDate;
    private String location;
    private String openfeedbackLink;

    @PropertyName("task")
    private List<Task> tasks;

    @PropertyName("resource")
    private List<Resource> resources;

    private String event;
    private List<String> speakers;
}
