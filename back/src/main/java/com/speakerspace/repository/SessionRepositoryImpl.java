package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.session.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.*;
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

    public List<String> findDistinctTracksByEventId(String eventId) {
        return executeFirestoreOperation(() -> {
            try {
                QuerySnapshot querySnapshot = firestore.collection(COLLECTION_NAME)
                        .whereEqualTo("eventId", eventId)
                        .get()
                        .get();

                Set<String> uniqueTracks = new HashSet<>();

                for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                    String track = doc.getString("track");
                    if (track != null && !track.trim().isEmpty()) {
                        uniqueTracks.add(track.trim());
                    }
                }

                return new ArrayList<>(uniqueTracks);

            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Failed to fetch tracks", e);
            }
        }, "Failed to fetch distinct tracks for event");
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

    public Session updateScheduleFields(String sessionId, Date start, Date end, String track) {
        return executeFirestoreOperation(() -> {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(sessionId);

            Map<String, Object> updates = new HashMap<>();

            if (start != null) {
                updates.put("start", start);
            }
            if (end != null) {
                updates.put("end", end);
            }
            if (track != null) {
                updates.put("track", track);
            }

            updates.put("updatedAt", new Date());

            try {
                docRef.update(updates).get();

                DocumentSnapshot updatedDoc = docRef.get().get();
                return updatedDoc.exists() ? updatedDoc.toObject(Session.class) : null;

            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Failed to update session schedule", e);
            }
        }, "Failed to update session schedule");
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
    public boolean delete(String id) {
        try {
            firestore.collection(COLLECTION_NAME).document(id).delete().get();
            return true;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to delete Session", e);
        }
    }

    @Override
    public int deleteByEventId(String eventId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME).whereEqualTo("eventId", eventId);
            QuerySnapshot querySnapshot = query.get().get();

            List<QueryDocumentSnapshot> documents = querySnapshot.getDocuments();

            if (documents.isEmpty()) {
                return 0;
            }

            WriteBatch batch = firestore.batch();

            for (QueryDocumentSnapshot document : documents) {
                batch.delete(document.getReference());
            }

            batch.commit().get();

            int deletedCount = documents.size();
            return deletedCount;

        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to batch delete sessions by event ID", e);
        }
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
