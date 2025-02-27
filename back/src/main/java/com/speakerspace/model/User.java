package com.speakerspace.model;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;
import com.google.cloud.firestore.annotation.PropertyName;
import com.google.common.primitives.Bytes;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.intellij.lang.annotations.Pattern;

import javax.annotation.Nullable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @DocumentId
    private String idUser;
    private String firstname;
    private String lastname;
    private String email;
    private String password;
    private @Nullable String picture;
    private Timestamp createDate;
    private @Nullable String country;
    private @Nullable String company;
    private @Nullable String biography;
    private @Nullable String phone;
    private @Nullable Timestamp birthday;
    private @Nullable String ticket;

    @PropertyName("social_networks")
    private List<SocialNetwork> socialNetworks;

    @PropertyName("travel_documents")
    private List<TravelDocument> travelDocuments;

    private List<String> groups;
    private List<String> events;
    private List<String> travels;
    private List<String> sessions;
    private List<String> tasks;
}
