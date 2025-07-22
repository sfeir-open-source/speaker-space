package com.speakerspace.model;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
public class TeamMember {

    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String userId;
    private String role;
    private String displayName;
    private String email;
    private String photoURL;
    private String status;
    private Boolean isCreator;

    public TeamMember(String userId, String role) {
        this.userId = userId;
        this.role = role;
    }
}
