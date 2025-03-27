package com.speakerspace.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.*;
import com.google.cloud.spring.secretmanager.SecretManagerTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.io.*;

@Configuration
@Profile("prod")
public class FirestoreConfigProd {

    private final String projectId;
    private final SecretManagerTemplate secretManagerTemplate;

    public FirestoreConfigProd(@Value("${spring.cloud.gcp.firestore.project-id}") String projectId, SecretManagerTemplate secretManagerTemplate) {
        this.projectId = projectId;
        this.secretManagerTemplate = secretManagerTemplate;
    }

    @Bean
    public Firestore firestore() throws IOException {
        InputStream serviceKey = new ByteArrayInputStream(secretManagerTemplate.getSecretBytes("firestore-secret"));

        GoogleCredentials credentials = GoogleCredentials.fromStream(serviceKey)
                .createScoped("https://www.googleapis.com/auth/cloud-platform");

        FirestoreOptions firestoreOptions = FirestoreOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build();

        return firestoreOptions.getService();
    }
}