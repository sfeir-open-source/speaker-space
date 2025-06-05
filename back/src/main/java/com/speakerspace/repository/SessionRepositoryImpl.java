package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.session.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class SessionRepositoryImpl implements SessionRepository {

    private static final String COLLECTION_NAME = "sessions";
    private static final Logger logger = LoggerFactory.getLogger(SessionRepositoryImpl.class);

    @Autowired
    private Firestore firestore;

    @Override
    public Session save(Session session) {
        try {
            DocumentReference docRef;

            if (session.getId() == null || session.getId().isEmpty()) {
                docRef = firestore.collection(COLLECTION_NAME).document();
                session.setId(docRef.getId());
            } else {
                docRef = firestore.collection(COLLECTION_NAME).document(session.getId());
            }

            docRef.set(session).get();
            return session;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error saving session: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save session", e);
        }
    }

    @Override
    public List<Session> findByEventId(String eventId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("eventId", eventId);
            QuerySnapshot querySnapshot = query.get().get();

            List<Session> sessions = new ArrayList<>();
            querySnapshot.getDocuments().forEach(doc -> {
                sessions.add(doc.toObject(Session.class));
            });

            return sessions;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding sessions by event ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find sessions by event ID", e);
        }
    }

    @Override
    public Session findById(String id) {
        try {
            DocumentSnapshot document = firestore.collection(COLLECTION_NAME).document(id).get().get();
            if (document.exists()) {
                return document.toObject(Session.class);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding session by ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find session", e);
        }
    }

    @Override
    public void deleteById(String id) {
        try {
            firestore.collection(COLLECTION_NAME).document(id).delete().get();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error deleting session: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete session", e);
        }
    }

    @Override
    public boolean existsByIdAndEventId(String id, String eventId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("id", id)
                    .whereEqualTo("eventId", eventId);
            QuerySnapshot querySnapshot = query.get().get();

            return !querySnapshot.isEmpty();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error checking session existence: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to check session existence", e);
        }
    }
}
