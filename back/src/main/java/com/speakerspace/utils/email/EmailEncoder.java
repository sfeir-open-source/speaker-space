package com.speakerspace.utils.email;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class EmailEncoder {

    public static String decodeFromBase64(String encodedEmail) {
        if (encodedEmail == null || encodedEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Encoded email cannot be null or empty");
        }

        try {
            byte[] decodedBytes = Base64.getUrlDecoder().decode(encodedEmail);
            return new String(decodedBytes, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid Base64 encoding: " + e.getMessage());
        }
    }
}
