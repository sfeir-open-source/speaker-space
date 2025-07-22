package com.speakerspace.model.session;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
public class Format {
    @NotBlank(message = "ID is required")
    @EqualsAndHashCode.Include
    private String id;
    private String name;
    private String description;
}
