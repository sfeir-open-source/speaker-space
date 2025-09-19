package com.speakerspace.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.spring.secretmanager.SecretManagerTemplate;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@RequiredArgsConstructor
public class FirebaseConfig {

    @Autowired(required = false)
    private final SecretManagerTemplate secretManagerTemplate;

    @Bean
    @Profile("local")
    public FirebaseAuth firebaseAuthLocal() throws IOException {
        return initializeFirebaseAuth(() ->
                new ClassPathResource("firebase-service.json").getInputStream()
        );
    }

    @Bean
    @Profile("prod")
    public FirebaseAuth firebaseAuthProd() throws IOException {
        return initializeFirebaseAuth(() ->
                new ByteArrayInputStream(secretManagerTemplate.getSecretBytes("firebase-secret"))
        );
    }

    private FirebaseAuth initializeFirebaseAuth(CredentialsSupplier credentialsSupplier) throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            try (InputStream serviceAccount = credentialsSupplier.get()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
            }
        }
        return FirebaseAuth.getInstance();
    }

    @FunctionalInterface
    private interface CredentialsSupplier {
        InputStream get() throws IOException;
    }
}
