package com.speakerspace.model;

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
public class Faq {

        @DocumentId
        private long idFaq;
        private String title;
        private String description;
        private @Nullable String maps;

        @PropertyName("media")
        private List<Media> medias;
}
