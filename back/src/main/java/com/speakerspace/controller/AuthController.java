package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.exception.ValidationException;
import com.speakerspace.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final CookieService cookieService;
    private final FirebaseAuth firebaseAuth;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody FirebaseTokenRequest request, HttpServletResponse response) {
        if (request.getIdToken() == null) {
            logger.error("No token provided in request");
            return ResponseEntity.badRequest().body("No token provided");
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(request.getIdToken());
            String uid = decodedToken.getUid();

            cookieService.setAuthCookie(response, request.getIdToken());
            logger.info("Setting auth cookie for user");

            UserDTO existingUser = userService.getUserByUid(uid);

            if (existingUser == null) {
                existingUser = createNewUser(decodedToken);
            } else {
                existingUser = updateExistingUserIfNeeded(existingUser, decodedToken);
            }

            return ResponseEntity.ok(existingUser);
        } catch (Exception e) {
            logger.error("Error during login", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        cookieService.clearAuthCookie(response);
        return ResponseEntity.ok().build();
    }

    private static class AuthenticationException extends Exception {
        public AuthenticationException(String message) {
            super(message);
        }
    }

    private static class SecurityException extends Exception {
        public SecurityException(String message) {
            super(message);
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserDTO userDTO) {
        try {
            logger.info("Creating/updating user: {}", userDTO.getUid());
            return ResponseEntity.ok(userService.saveUser(userDTO));
        } catch (Exception e) {
            logger.error("Error creating/updating user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create/update user: " + e.getMessage());
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserByUid(@PathVariable String uid) {
        UserDTO userDTO = userService.getUserByUid(uid);
        return userDTO != null
                ? ResponseEntity.ok(userDTO)
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/user/{uid}")
    public ResponseEntity<?> getUserData(@PathVariable String uid, HttpServletRequest request) {
        try {
            String tokenUid = authenticateAndAuthorize(request, uid);

            UserDTO userDTO = userService.getUserByUid(uid);
            if (userDTO == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(userDTO);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to retrieve user data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve user data: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody UserDTO userDTO, HttpServletRequest request) {
        try {
            String uid = authenticateAndAuthorize(request, userDTO.getUid());

            UserDTO existingUser = userService.getUserByUid(uid);
            if (existingUser == null) {
                return ResponseEntity.notFound().build();
            }

            UserDTO updatedUser = userService.partialUpdateUser(userDTO, existingUser);
            return ResponseEntity.ok(updatedUser);
        } catch (ValidationException e) {
            logger.warn("Validation error during profile update: {}", e.getErrors());
            return ResponseEntity.badRequest().body(e.getErrors());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Failed to update profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update profile: " + e.getMessage());
        }
    }

    private UserDTO createNewUser(FirebaseToken decodedToken) {
        UserDTO userDTO = new UserDTO();
        userDTO.setUid(decodedToken.getUid());
        userDTO.setEmail(decodedToken.getEmail());
        userDTO.setDisplayName(decodedToken.getName());
        userDTO.setPhotoURL(decodedToken.getPicture());

        UserDTO createdUser = userService.saveUser(userDTO);
        if (createdUser == null) {
            logger.error("Failed to create new user");
            throw new RuntimeException("Failed to create user");
        }
        return createdUser;
    }

    private UserDTO updateExistingUserIfNeeded(UserDTO existingUser, FirebaseToken decodedToken) {
        boolean needsUpdate = false;

        if (existingUser.getEmail() == null && decodedToken.getEmail() != null) {
            existingUser.setEmail(decodedToken.getEmail());
            needsUpdate = true;
        }

        if ((existingUser.getDisplayName() == null || existingUser.getDisplayName().isEmpty())
                && decodedToken.getName() != null) {
            existingUser.setDisplayName(decodedToken.getName());
            needsUpdate = true;
        }

        if ((existingUser.getPhotoURL() == null || existingUser.getPhotoURL().isEmpty())
                && decodedToken.getPicture() != null) {
            existingUser.setPhotoURL(decodedToken.getPicture());
            needsUpdate = true;
        }

        if (needsUpdate) {
            existingUser = userService.saveUser(existingUser);
        }

        return existingUser;
    }

    private String authenticateAndAuthorize(HttpServletRequest request, String targetUid)
            throws AuthenticationException, SecurityException {
        String token = cookieService.getAuthTokenFromCookies(request);
        if (token == null) {
            throw new AuthenticationException("Authentication required");
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String tokenUid = decodedToken.getUid();

            if (!tokenUid.equals(targetUid)) {
                throw new SecurityException("Not authorized to access this profile");
            }

            return tokenUid;
        } catch (FirebaseAuthException e) {
            if (e.getMessage().contains("expired")) {
                throw new AuthenticationException("Token expired, please refresh");
            }
            throw new RuntimeException(e);
        }
    }
}
