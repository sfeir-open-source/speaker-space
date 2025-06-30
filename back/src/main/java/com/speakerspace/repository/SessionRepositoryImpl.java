package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.session.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Repository
public class SessionRepositoryImpl implements SessionRepository {

    private static final String COLLECTION_NAME = "sessions";

    @Autowired
    private Firestore firestore;

    @Override
    public Session save(Session session) {
        return executeFirestoreOperation(() -> {
            DocumentReference docRef = getDocumentReference(session);
            try {
                docRef.set(session).get();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }
            return session;
        }, "Failed to save session");
    }

    @Override
    public List<Session> findByEventId(String eventId) {
        return executeFirestoreOperation(() -> {
            Query query = firestore.collection(COLLECTION_NAME).whereEqualTo("eventId", eventId);
            QuerySnapshot querySnapshot = null;
            try {
                querySnapshot = query.get().get();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }

            return querySnapshot.getDocuments().stream()
                    .map(doc -> doc.toObject(Session.class))
                    .collect(Collectors.toList());
        }, "Failed to find sessions by event ID");
    }

    @Override
    public Session findById(String id) {
        return executeFirestoreOperation(() -> {
            DocumentSnapshot document = null;
            try {
                document = firestore.collection(COLLECTION_NAME).document(id).get().get();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }
            return document.exists() ? document.toObject(Session.class) : null;
        }, "Failed to find session");
    }

    @Override
    public void deleteById(String id) {
        executeFirestoreOperation(() -> {
            try {
                firestore.collection(COLLECTION_NAME).document(id).delete().get();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }
            return null;
        }, "Failed to delete session");
    }

    @Override
    public boolean existsByIdAndEventId(String id, String eventId) {
        return executeFirestoreOperation(() -> {
            Query query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("id", id)
                    .whereEqualTo("eventId", eventId);
            try {
                return !query.get().get().isEmpty();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }
        }, "Failed to check session existence");
    }

    @Override
    public Session findByIdAndEventId(String sessionId, String eventId) {
        return executeFirestoreOperation(() -> {
            Query query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("id", sessionId)
                    .whereEqualTo("eventId", eventId);
            QuerySnapshot querySnapshot = null;
            try {
                querySnapshot = query.get().get();
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            } catch (ExecutionException e) {
                throw new RuntimeException(e);
            }

            return querySnapshot.isEmpty() ? null :
                    querySnapshot.getDocuments().get(0).toObject(Session.class);
        }, "Failed to find session");
    }

    private DocumentReference getDocumentReference(Session session) {
        if (session.getId() == null || session.getId().isEmpty()) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
            session.setId(docRef.getId());
            return docRef;
        }
        return firestore.collection(COLLECTION_NAME).document(session.getId());
    }

    private <T> T executeFirestoreOperation(Supplier<T> operation, String errorMessage) {
        return operation.get();
    }
}
