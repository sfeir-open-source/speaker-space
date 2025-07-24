package com.speakerspace.exception;

import com.speakerspace.dto.EventDTO;
import com.speakerspace.security.AuthenticationHelper;
import com.speakerspace.service.EventService;
import com.speakerspace.utils.email.UserEmailExtractor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.nio.file.AccessDeniedException;
import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class EventAuthorizationHelper {

    private final EventService eventService;
    private final AuthenticationHelper authHelper;
    private final UserEmailExtractor emailExtractor;

    public void validateEventAuthorization(String eventId, Authentication authentication) throws AccessDeniedException {
        if (authentication == null) {
            throw new UnauthorizedException("Authentication required");
        }

        EventDTO existingEvent = eventService.getEventById(eventId);
        if (existingEvent == null) {
            throw new EntityNotFoundException("Event not found with id: " + eventId);
        }

        if (!authHelper.isUserAuthorized(authentication, existingEvent.userCreateId())) {
            throw new AccessDeniedException("User not authorized to access this event");
        }

    }

    public void validateUserAuthentication(HttpServletRequest request, Authentication authentication) {
        String userEmail = emailExtractor.extractUserEmail(request, authentication);
        if (userEmail == null) {
            throw new UnauthorizedException("Valid authentication required");
        }
    }

    public <T> ResponseEntity<T> executeWithEventAuthorization(String eventId, Authentication authentication,
                                                               Supplier<T> operation) throws AccessDeniedException {
        validateEventAuthorization(eventId, authentication);

        T result = operation.get();
        if (result == null) {
            throw new EntityNotFoundException("Resource not found");
        }

        return ResponseEntity.ok(result);
    }

    public <T> ResponseEntity<T> executeWithUserAuthentication(HttpServletRequest request, Authentication authentication,
                                                               Supplier<T> operation) {
        validateUserAuthentication(request, authentication);

        T result = operation.get();
        if (result == null) {
            throw new EntityNotFoundException("Resource not found");
        }

        return ResponseEntity.ok(result);
    }
}
