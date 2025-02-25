package com.speakerspace.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirestoreConfig {

    @Value("${spring.cloud.gcp.firestore.project-id}")
    private String projectId;

    @Value("${spring.cloud.gcp.credentials.location}")
    private String credentialsPath;

    @Bean
    public Firestore firestore() throws IOException {
        String actualPath = credentialsPath.replace("file:", "");

        File credentialsFile = new File(actualPath);
        if (!credentialsFile.exists()) {
            throw new IllegalStateException("Credentials file not found: " + actualPath);
        }

        GoogleCredentials credentials = GoogleCredentials.fromStream(
                new FileInputStream(credentialsFile)
        ).createScoped("https://www.googleapis.com/auth/cloud-platform");

        FirestoreOptions firestoreOptions = FirestoreOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build();

        return firestoreOptions.getService();
    }
}