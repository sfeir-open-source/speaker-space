package com.speakerspace.repository;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QuerySnapshot;
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
            logger.info("Session saved with ID: {}", session.getId());
            return session;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error saving session: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save session", e);
        }
    }

    @Override
    public Session findById(String id) {
        return null;
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
    public void deleteById(String id) {

    }

    @Override
    public boolean existsByIdAndEventId(String id, String eventId) {
        return false;
    }
}
