package com.speakerspace.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.WriteResult;
import org.springframework.stereotype.Service;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreTestService {
    private final Firestore firestore;

    public FirestoreTestService(Firestore firestore) {
        this.firestore = firestore;
    }

    public String testConnection() {
        try {
            DocumentSnapshot document = firestore.collection("test").document("ping").get().get();
            if (document.exists()) {
                return "Connexion à Firestore réussie ! Contenu: " + document.getString("message");
            } else {
                return "Le document test n'existe pas.";
            }
        } catch (InterruptedException | ExecutionException e) {
            return "Erreur connexion à Firestore : " + e.getMessage();
        }
    }
}
