package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.exception.*;
import com.speakerspace.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final CookieService cookieService;
    private final FirebaseAuth firebaseAuth;

    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody FirebaseTokenRequest request, HttpServletResponse response) {
        if (request.getIdToken() == null) {
            throw new IllegalArgumentException("No token provided");
        }

        FirebaseToken decodedToken = verifyFirebaseToken(request.getIdToken());
        String uid = decodedToken.getUid();

        cookieService.setAuthCookie(response, request.getIdToken());

        UserDTO existingUser = userService.getUserByUid(uid);

        if (existingUser == null) {
            existingUser = createNewUser(decodedToken);
        } else {
            existingUser = updateExistingUserIfNeeded(existingUser, decodedToken);
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
        logger.info("Creating/updating user: {}", userDTO.uid());
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

    private FirebaseToken verifyFirebaseToken(String idToken) {
        try {
            return firebaseAuth.verifyIdToken(idToken);
        } catch (FirebaseAuthException e) {
            logger.error("Firebase token verification failed: {}", e.getMessage());
            throw new FirebaseAuthenticationException("Invalid token");
        }
    }

    private UserDTO createNewUser(FirebaseToken decodedToken) {
        UserDTO userDTO = UserDTO.builder()
                .uid(decodedToken.getUid())
                .email(decodedToken.getEmail())
                .displayName(decodedToken.getName())
                .photoURL(decodedToken.getPicture())
                .build();

        UserDTO createdUser = userService.saveUser(userDTO);
        if (createdUser == null) {
            throw new RuntimeException("Failed to create user");
        }
        return createdUser;
    }

    private UserDTO updateExistingUserIfNeeded(UserDTO existingUser, FirebaseToken decodedToken) {
        boolean needsUpdate = false;
        UserDTO.UserDTOBuilder builder = UserDTO.builder()
                .uid(existingUser.uid())
                .email(existingUser.email())
                .displayName(existingUser.displayName())
                .photoURL(existingUser.photoURL())
                .company(existingUser.company())
                .city(existingUser.city())
                .phoneNumber(existingUser.phoneNumber())
                .githubLink(existingUser.githubLink())
                .twitterLink(existingUser.twitterLink())
                .blueSkyLink(existingUser.blueSkyLink())
                .linkedInLink(existingUser.linkedInLink())
                .biography(existingUser.biography())
                .otherLink(existingUser.otherLink());

        if (existingUser.email() == null && decodedToken.getEmail() != null) {
            builder.email(decodedToken.getEmail());
            needsUpdate = true;
        }

        if ((existingUser.displayName() == null || existingUser.displayName().isEmpty())
                && decodedToken.getName() != null) {
            builder.displayName(decodedToken.getName());
            needsUpdate = true;
        }

        if ((existingUser.photoURL() == null || existingUser.photoURL().isEmpty())
                && decodedToken.getPicture() != null) {
            builder.photoURL(decodedToken.getPicture());
            needsUpdate = true;
        }

        if (needsUpdate) {
            UserDTO updatedUserDTO = builder.build();
            return userService.saveUser(updatedUserDTO);
        }

        return existingUser;
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
}
