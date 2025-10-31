package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.exception.*;
import com.speakerspace.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final CookieService cookieService;

    @PostMapping("/login")
    public ResponseEntity<UserDTO> login(@RequestBody FirebaseTokenRequest request, HttpServletResponse response) {
        if (request.idToken() == null) {
            throw new IllegalArgumentException("No token provided");
        }

        FirebaseToken decodedToken = userService.verifyFirebaseToken(request.idToken());
        String uid = decodedToken.getUid();

        cookieService.setAuthCookie(response, request.idToken());

        UserDTO existingUser = userService.getUserByUid(uid);

        if (existingUser == null) {
            existingUser = userService.createNewUser(decodedToken);
        } else {
            existingUser = userService.updateExistingUserIfNeeded(existingUser, decodedToken);
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
        userService.authenticateAndAuthorize(request, uid);

        UserDTO userDTO = userService.getUserByUid(uid);
        if (userDTO == null) {
            throw new EntityNotFoundException("User not found with uid: " + uid);
        }

        return ResponseEntity.ok(userDTO);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateUserProfile(@RequestBody UserDTO userDTO, HttpServletRequest request) {
        String uid = userService.authenticateAndAuthorize(request, userDTO.uid());

        UserDTO existingUser = userService.getUserByUid(uid);
        if (existingUser == null) {
            throw new EntityNotFoundException("User not found with uid: " + uid);
        }

        UserDTO updatedUser = userService.partialUpdateUser(userDTO, existingUser);
        return ResponseEntity.ok(updatedUser);
    }
}
