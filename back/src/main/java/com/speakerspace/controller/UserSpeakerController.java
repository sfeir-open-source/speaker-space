package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.exception.EventAuthorizationHelper;
import com.speakerspace.dto.UserSpeakerProfileDTO;
import com.speakerspace.service.UserSpeakerLinkService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user-speaker")
@RequiredArgsConstructor
public class UserSpeakerController {

    private final UserSpeakerLinkService userSpeakerLinkService;
    private final EventAuthorizationHelper authorizationHelper;

    @GetMapping("/profile/event/{eventId}")
    public ResponseEntity<ResponseEntity<UserSpeakerProfileDTO>> getUserSpeakerProfile(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () -> {
            String userUid = extractUidFromAuthentication(authentication);

            UserSpeakerProfileDTO profile = userSpeakerLinkService.getUserSpeakerProfile(userUid, eventId);
            return ResponseEntity.ok(profile);
        });
    }

    @PostMapping("/sync/event/{eventId}")
    public ResponseEntity<ResponseEntity<Object>> syncSpeakerDataToUser(
            @PathVariable String eventId,
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () -> {
            String userUid = extractUidFromAuthentication(authentication);

            userSpeakerLinkService.syncSpeakerDataToUser(userUid, eventId);
            return ResponseEntity.ok().build();
        });
    }

    @GetMapping("/events")
    public ResponseEntity<ResponseEntity<List<String>>> getUserSpeakerEvents(
            HttpServletRequest request,
            Authentication authentication) {

        return authorizationHelper.executeWithUserAuthentication(request, authentication, () -> {
            String userUid = extractUidFromAuthentication(authentication);

            List<String> eventIds = userSpeakerLinkService.getUserSpeakerEventIds(userUid);
            return ResponseEntity.ok(eventIds);
        });
    }

    private String extractUidFromAuthentication(Authentication authentication) {
        if (authentication.getPrincipal() instanceof FirebaseToken token) {
            return token.getUid();
        }

        if (authentication.getDetails() instanceof Map<?, ?> details) {
            return (String) details.get("uid");
        }

        throw new IllegalStateException("Unable to extract UID from authentication");
    }
}
