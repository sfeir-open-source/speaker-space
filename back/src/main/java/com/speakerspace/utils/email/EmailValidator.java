package com.speakerspace.utils.email;

import org.springframework.stereotype.Component;

@Component
public class EmailValidator {

    private static final String EMAIL_PATTERN = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    public static boolean isValid(String email) {
        return email != null &&
                !email.trim().isEmpty() &&
                email.matches(EMAIL_PATTERN) &&
                email.length() <= 254;
    }
}
