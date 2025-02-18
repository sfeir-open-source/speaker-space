package com.speakerspace.config;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1")
public class TestConnectionFrontBackController {

    @GetMapping("/test")
    public String testConnection() {
        return "Connection successful! ";
    }
}
