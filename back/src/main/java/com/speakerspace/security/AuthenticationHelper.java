package com.speakerspace.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class AuthenticationHelper {

    public boolean isUserAuthorized(Authentication authentication, String resourceOwnerId) {
        if (authentication == null) return false;

        String userId = authentication.getName();
        return userId.equals(resourceOwnerId) || hasAdminRole(authentication);
    }

    public boolean hasAdminRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    public String getUserId(Authentication authentication) {
        return authentication != null ? authentication.getName() : null;
    }
}
