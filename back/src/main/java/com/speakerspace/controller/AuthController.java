package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.model.User;
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

    @Autowired
    private UserService userService;

    @Autowired
    private CookieService cookieService;

    @Autowired
    private FirebaseAuth firebaseAuth;

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

            User user = userService.getUserByUid(uid);
            if (user == null) {
                user = new User();
                user.setUid(uid);
                user.setEmail(decodedToken.getEmail());
                user.setDisplayName(decodedToken.getName());
                user.setPhotoURL(decodedToken.getPicture());
                user = userService.saveUser(user);
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            logger.error("Error during login", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            logger.info("Creating/updating user: {}", user.getUid());

            User existingUser = userService.getUserByUid(user.getUid());

            if (existingUser != null) {
                if (existingUser.getCompany() != null && user.getCompany() == null) {
                    user.setCompany(existingUser.getCompany());
                }
                if (existingUser.getCity() != null && user.getCity() == null) {
                    user.setCity(existingUser.getCity());
                }
                if (existingUser.getPhoneNumber() != null && user.getPhoneNumber() == null) {
                    user.setPhoneNumber(existingUser.getPhoneNumber());
                }
                if (existingUser.getGithubLink() != null && user.getGithubLink() == null) {
                    user.setGithubLink(existingUser.getGithubLink());
                }
                if (existingUser.getTwitterLink() != null && user.getTwitterLink() == null) {
                    user.setTwitterLink(existingUser.getTwitterLink());
                }
                if (existingUser.getBlueSkyLink() != null && user.getBlueSkyLink() == null) {
                    user.setBlueSkyLink(existingUser.getBlueSkyLink());
                }
                if (existingUser.getLinkedInLink() != null && user.getLinkedInLink() == null) {
                    user.setLinkedInLink(existingUser.getLinkedInLink());
                }
// TODO : les autres après
            }

            User savedUser = userService.saveUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            logger.error("Error creating/updating user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create/update user: " + e.getMessage());
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserByUid(@PathVariable String uid) {
        User user = userService.getUserByUid(uid);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody User user, HttpServletRequest request) {
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
            if (!uid.equals(user.getUid())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not authorized to update this profile");
            }

            User updatedUser = new User();
            updatedUser.setUid(uid);
            updatedUser.setDisplayName(user.getDisplayName());
            updatedUser.setPhotoURL(user.getPhotoURL());
            updatedUser.setCompany(user.getCompany());
            updatedUser.setCity(user.getCity());
            updatedUser.setPhoneNumber(user.getPhoneNumber());
            updatedUser.setGithubLink(user.getGithubLink());
            updatedUser.setTwitterLink(user.getTwitterLink());
            updatedUser.setBlueSkyLink(user.getBlueSkyLink());
            updatedUser.setLinkedInLink(user.getLinkedInLink());
// TODO : les autres après
            User result = userService.updateUser(updatedUser);
            if (result == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update profile: " + e.getMessage());
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

            User user = userService.getUserByUid(uid);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to retrieve user data: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        cookieService.clearAuthCookie(response);
        return ResponseEntity.ok().build();
    }
}