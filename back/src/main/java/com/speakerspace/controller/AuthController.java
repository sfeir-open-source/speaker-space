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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;
    private final CookieService cookieService;
    private final FirebaseAuth firebaseAuth;

    @Autowired
    public AuthController(UserService userService, CookieService cookieService,
                          FirebaseAuth firebaseAuth) {
        this.userService = userService;
        this.cookieService = cookieService;
        this.firebaseAuth = firebaseAuth;
    }

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
                UserDTO userDTO = new UserDTO();
                userDTO.setUid(uid);
                userDTO.setEmail(decodedToken.getEmail());
                userDTO.setDisplayName(decodedToken.getName());
                userDTO.setPhotoURL(decodedToken.getPicture());

                existingUser = userService.saveUser(userDTO);

                if (existingUser == null) {
                    logger.error("Failed to create new user");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create user");
                }
            } else {
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
            }

            return ResponseEntity.ok(existingUser);
        } catch (Exception e) {
            logger.error("Error during login", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserDTO userDTO) {
        try {
            logger.info("Creating/updating user: {}", userDTO.getUid());

            UserDTO savedUserDTO = userService.saveUser(userDTO);
            return ResponseEntity.ok(savedUserDTO);
        } catch (Exception e) {
            logger.error("Error creating/updating user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create/update user: " + e.getMessage());
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserByUid(@PathVariable String uid) {
        UserDTO userDTO = userService.getUserByUid(uid);
        if (userDTO == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(userDTO);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody UserDTO userDTO, HttpServletRequest request) {
        try {
            String token = cookieService.getAuthTokenFromCookies(request);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
            }

            FirebaseToken decodedToken;
            try {
                decodedToken = firebaseAuth.verifyIdToken(token);
            } catch (FirebaseAuthException e) {
                if (e.getMessage().contains("expired")) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token expired, please refresh");
                }
                throw e;
            }

            String uid = decodedToken.getUid();
            if (!uid.equals(userDTO.getUid())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to update this profile");
            }

            UserDTO updatedUserDTO = userService.updateUser(userDTO);
            if (updatedUserDTO == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(updatedUserDTO);
        } catch (ValidationException e) {
            logger.warn("Validation error during profile update: {}", e.getErrors());
            return ResponseEntity.badRequest().body(e.getErrors());
        } catch (Exception e) {
            logger.error("Failed to update profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update profile: " + e.getMessage());
        }
    }

    @GetMapping("/user/{uid}")
    public ResponseEntity<?> getUserData(@PathVariable String uid, HttpServletRequest request) {
        try {
            String token = cookieService.getAuthTokenFromCookies(request);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required");
            }

            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String tokenUid = decodedToken.getUid();

            if (!tokenUid.equals(uid)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to access this profile");
            }

            UserDTO userDTO = userService.getUserByUid(uid);
            if (userDTO == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            logger.error("Failed to retrieve user data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to retrieve user data: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        cookieService.clearAuthCookie(response);
        return ResponseEntity.ok().build();
    }
}