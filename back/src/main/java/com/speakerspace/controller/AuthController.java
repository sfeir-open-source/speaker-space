package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.exception.*;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.service.UserService;
import com.speakerspace.service.UserSpeakerLinkService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;

@RestController
@Slf4j
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserSpeakerLinkService userSpeakerLinkService;
    private final CookieService cookieService;
    private final FirebaseAuth firebaseAuth;
    private final UserMapper userMapper;

    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody FirebaseTokenRequest request, HttpServletResponse response) {
        if (request.getIdToken() == null) {
            throw new IllegalArgumentException("No token provided");
        }

        FirebaseToken decodedToken = verifyFirebaseToken(request.getIdToken());
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();

        cookieService.setAuthCookie(response, request.getIdToken());

        UserDTO existingUser = userService.getUserByUid(uid);

        if (existingUser == null) {
            existingUser = createNewUser(decodedToken);

            if (email != null) {
                linkSpeakersToUser(uid, email);
            }
        } else {
            existingUser = updateExistingUserIfNeeded(existingUser, decodedToken);

            if (existingUser.email() != null &&
                    (email == null || !email.equalsIgnoreCase(existingUser.email()))) {
                linkSpeakersToUser(uid, existingUser.email());
            }
        }

        return ResponseEntity.ok(existingUser);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        cookieService.clearAuthCookie(response);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody UserDTO userDTO) {
        log.info("Creating/updating user: {}", userDTO.uid());
        UserDTO savedUser = userService.saveUser(userDTO);
        return ResponseEntity.ok(savedUser);
    }

    @GetMapping("/{uid}")
    public ResponseEntity<UserDTO> getUserByUid(@PathVariable String uid) {
        UserDTO userDTO = userService.getUserByUid(uid);
        if (userDTO == null) {
            throw new EntityNotFoundException("User not found with uid: " + uid);
        }
        return ResponseEntity.ok(userDTO);
    }

    @GetMapping("/user/{uid}")
    public ResponseEntity<UserDTO> getUserData(@PathVariable String uid, HttpServletRequest request) {
        authenticateAndAuthorize(request, uid);

        UserDTO userDTO = userService.getUserByUid(uid);
        if (userDTO == null) {
            throw new EntityNotFoundException("User not found with uid: " + uid);
        }

        return ResponseEntity.ok(userDTO);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateUserProfile(@RequestBody UserDTO userDTO, HttpServletRequest request) {
        String uid = authenticateAndAuthorize(request, userDTO.uid());

        UserDTO existingUser = userService.getUserByUid(uid);
        if (existingUser == null) {
            throw new EntityNotFoundException("User not found with uid: " + uid);
        }

        UserDTO updatedUser = userService.partialUpdateUser(userDTO, existingUser);
        return ResponseEntity.ok(updatedUser);
    }

    private String authenticateAndAuthorize(HttpServletRequest request, String targetUid) {
        String token = cookieService.getAuthTokenFromCookies(request);
        if (token == null) {
            throw new UnauthorizedException("Authentication required");
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String tokenUid = decodedToken.getUid();

            if (!tokenUid.equals(targetUid)) {
                throw new AccessDeniedException("Not authorized to access this profile");
            }

            return tokenUid;
        } catch (FirebaseAuthException | AccessDeniedException e) {
            if (e.getMessage().contains("expired")) {
                throw new TokenExpiredException("Token expired, please refresh");
            }
            throw new FirebaseAuthenticationException("Token verification failed", e);
        }
    }

    private FirebaseToken verifyFirebaseToken(String idToken) {
        try {
            return firebaseAuth.verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            log.error("Firebase token verification failed: {}", e.getMessage());
            throw new FirebaseAuthenticationException("Invalid token");
        }
    }

    private UserDTO createNewUser(FirebaseToken decodedToken) {
        UserDTO userDTO = userMapper.createFromFirebaseToken(decodedToken);

        UserDTO createdUser = userService.saveUser(userDTO);
        if (createdUser == null) {
            throw new RuntimeException("Failed to create user");
        }
        return createdUser;
    }

    private UserDTO updateExistingUserIfNeeded(UserDTO existingUser, FirebaseToken decodedToken) {
        UserMapper.UpdateResult updateResult = userMapper.updateFromFirebaseTokenIfNeeded(existingUser, decodedToken);

        if (updateResult.wasUpdated()) {
            return userService.saveUser(updateResult.getUserDTO());
        }

        return existingUser;
    }

    private void linkSpeakersToUser(String uid, String email) {
        userSpeakerLinkService.linkExistingSpeakersToNewUser(uid, email)
                .whenComplete((result, throwable) -> {
                    if (throwable != null) {
                        log.error("Failed to link speakers for user {}: {}", uid, throwable.getMessage());
                    } else {
                        log.info("Successfully completed speaker linking for user {}", uid);
                    }
                });
    }
}
