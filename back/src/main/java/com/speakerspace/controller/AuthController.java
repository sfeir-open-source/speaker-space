package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.model.User;
import com.speakerspace.service.UserService;
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
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(savedUser);
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserByUid(@PathVariable String uid) {
        User user = userService.getUserByUid(uid);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        cookieService.clearAuthCookie(response);
        return ResponseEntity.ok().build();
    }
}