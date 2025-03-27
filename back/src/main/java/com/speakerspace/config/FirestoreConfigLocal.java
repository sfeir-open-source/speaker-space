package com.speakerspace.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
@Profile("local")
public class FirestoreConfigLocal {

    @Value("${spring.cloud.gcp.firestore.project-id}")
    private String projectId;

    @Bean
    public Firestore firestore() throws IOException {

        InputStream serviceKey = new ClassPathResource("firestore-key.json").getInputStream();

        GoogleCredentials credentials = GoogleCredentials.fromStream(serviceKey)
                .createScoped("https://www.googleapis.com/auth/cloud-platform");

        FirestoreOptions firestoreOptions = FirestoreOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build();

        return firestoreOptions.getService();
    }
}