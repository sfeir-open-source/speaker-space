package com.speakerspace.utils.email;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class UserEmailExtractor {

    public String extractUserEmail(HttpServletRequest request, Authentication authentication) {
        String userEmail = (String) request.getAttribute("userEmail");

        if (userEmail == null && authentication != null) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof String) {
                userEmail = (String) principal;
            }
        }

        if (userEmail == null) {
            HttpSession httpSession = request.getSession(false);
            if (httpSession != null) {
                userEmail = (String) httpSession.getAttribute("userEmail");
            }
        }

        return userEmail;
    }
}
