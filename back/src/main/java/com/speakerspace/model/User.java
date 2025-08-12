package com.speakerspace.model;

import com.google.cloud.firestore.annotation.PropertyName;
import com.google.cloud.spring.data.firestore.Document;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.validator.constraints.URL;

import java.util.Date;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@Document
public class User {

    @NotBlank(message = "User ID is required")
    @EqualsAndHashCode.Include
    private String uid;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Size(min = 2, message = "Display name must be at least 2 characters")
    private String name;

    @Size(min = 2, message = "Company name must be at least 2 characters if provided")
    private String company;

    @Size(min = 2, message = "Location must be at least 2 characters if provided")
    private String location;

    @URL(message = "Invalid photo URL format")
    @PropertyName("photo_url")
    private String photoURL;

    @Pattern(regexp = "^(\\+?[0-9\\s.-]{6,})?$", message = "Invalid phone number format")
    @PropertyName("phone_number")
    private String phoneNumber;

    private String bio;

    private List<String> socialLinks;

    private List<String> speakerIds;
    private List<String> eventIds;
    private List<String> sessionIds;
    private Date createdAt;
    private Date updatedAt;

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
                ", name='" + name + '\'' +
                ", company='" + company + '\'' +
                ", city='" + location + '\'' +
                '}';
    }
}