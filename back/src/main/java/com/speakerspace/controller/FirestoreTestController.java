package com.speakerspace.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/firestore")
public class FirestoreTestController {

    @GetMapping("/connection-info")
    public ResponseEntity<Map<String, Object>> connectionInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Connexion à Firestore réussie");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user-access")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> userAccess(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Accès USER réussi");
        response.put("user", authentication.getName());
        response.put("roles", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin-access")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminAccess(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Accès ADMIN réussi");
        response.put("user", authentication.getName());
        response.put("roles", authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auth-info")
    public ResponseEntity<Map<String, Object>> getAuthInfo(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        if (authentication != null) {
            response.put("authenticated", true);
            response.put("principal", authentication.getName());
            response.put("authorities", authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList()));
        } else {
            response.put("authenticated", false);
        }

        return ResponseEntity.ok(response);
    }
}