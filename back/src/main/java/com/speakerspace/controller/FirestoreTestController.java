package com.speakerspace.controller;

import com.speakerspace.service.FirestoreTestService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/firestore")
public class FirestoreTestController {
    private final FirestoreTestService firestoreTestService;

    public FirestoreTestController(FirestoreTestService firestoreTestService) {
        this.firestoreTestService = firestoreTestService;
    }

    @GetMapping("/connection-info")
    public Map<String, String> testFirestoreConnection() {
        String result = firestoreTestService.testConnection();
        Map<String, String> response = new HashMap<>();
        response.put("message", result);
        return response;
    }
}
