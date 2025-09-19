package com.speakerspace.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.*;
import com.google.cloud.spring.secretmanager.SecretManagerTemplate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;

import java.io.*;

@Configuration
@RequiredArgsConstructor
public class FirestoreConfig {

    @Value("${spring.cloud.gcp.firestore.project-id}")
    private String projectId;

    @Autowired(required = false)
    private final SecretManagerTemplate secretManagerTemplate;

    private static final String FIRESTORE_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    @Bean
    @Profile("local")
    public Firestore firestoreLocal() throws IOException {
        return createFirestore(() ->
                new ClassPathResource("firestore-key.json").getInputStream()
        );
    }

    @Bean
    @Profile("prod")
    public Firestore firestoreProd() throws IOException {
        return createFirestore(() ->
                new ByteArrayInputStream(secretManagerTemplate.getSecretBytes("firestore-secret"))
        );
    }

    private Firestore createFirestore(CredentialsSupplier credentialsSupplier) throws IOException {
        try (InputStream serviceKey = credentialsSupplier.get()) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceKey)
                    .createScoped(FIRESTORE_SCOPE);

            FirestoreOptions firestoreOptions = FirestoreOptions.newBuilder()
                    .setProjectId(projectId)
                    .setCredentials(credentials)
                    .build();

            return firestoreOptions.getService();
        }
    }

    @FunctionalInterface
    private interface CredentialsSupplier {
        InputStream get() throws IOException;
    }
}
