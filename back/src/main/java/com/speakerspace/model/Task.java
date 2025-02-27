package com.speakerspace.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.annotation.Nullable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @DocumentId
    private String idTask;
    private String title;
    private @Nullable String description;
    private @Nullable String speakerResponse;
    private @Nullable String reminderFrequency;
    private Timestamp deadline;
    private boolean isFinished;
}
