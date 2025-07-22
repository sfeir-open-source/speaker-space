package com.speakerspace.model;

import com.google.cloud.firestore.annotation.PropertyName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.validator.constraints.URL;

import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
public class User {

    @NotBlank(message = "User ID is required")
    @EqualsAndHashCode.Include
    private String uid;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 2, message = "Display name must be at least 2 characters")
    @PropertyName("display_name")
    private String displayName;

    @Size(min = 2, message = "Company name must be at least 2 characters if provided")
    private String company;

    @Size(min = 2, message = "City must be at least 2 characters if provided")
    private String city;

    @URL(message = "Invalid photo URL format")
    @PropertyName("photo_url")
    private String photoURL;

    @Pattern(regexp = "^(\\+?[0-9\\s.-]{6,})?$", message = "Invalid phone number format")
    @PropertyName("phone_number")
    private String phoneNumber;

    private String biography;

    @URL(message = "Invalid GitHub URL format")
    @PropertyName("github_link")
    private String githubLink;

    @URL(message = "Invalid Twitter URL format")
    @PropertyName("twitter_link")
    private String twitterLink;

    @URL(message = "Invalid BlueSky URL format")
    @PropertyName("bluesky_link")
    private String blueSkyLink;

    @URL(message = "Invalid LinkedIn URL format")
    @PropertyName("linkedin_link")
    private String linkedInLink;

    @URL(message = "Invalid URL format")
    @PropertyName("other_link")
    private String otherLink;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(uid, user.uid);
    }

    @Override
    public String toString() {
        return "User{" +
                "uid='" + uid + '\'' +
                ", email='" + email + '\'' +
                ", displayName='" + displayName + '\'' +
                ", company='" + company + '\'' +
                ", city='" + city + '\'' +
                '}';
    }
}