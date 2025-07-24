package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.session.Session;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Repository
public class SessionRepositoryImpl extends AbstractFirestoreRepository<Session, String>
        implements SessionRepository {

    public SessionRepositoryImpl(Firestore firestore) {
        super(firestore, Session.class, "sessions");
    }

    @Override
    protected DocumentReference getDocumentReference(Session session) {
        if (session.getId() == null || session.getId().isEmpty()) {
            DocumentReference docRef = getCollection().document();
            session.setId(docRef.getId());
            return docRef;
        }
        return getCollection().document(session.getId());
    }

    @Override
    public void saveSession(Session session) {
        Date now = new Date();
        if (session.getCreatedAt() == null) {
            session.setCreatedAt(now);
        }
        session.setUpdatedAt(now);
        saveSync(session);
    }

    @Override
    public Session findSessionById(String id) {
        return findByIdSync(id).orElse(null);
    }

    @Override
    public List<Session> findByEventId(String eventId) {
        return executeQuery(getCollection().whereEqualTo("eventId", eventId));
    }

    @Override
    public List<String> findDistinctTracksByEventId(String eventId) {
        return executeQuery(getCollection().whereEqualTo("eventId", eventId))
                .stream()
                .map(Session::getTrack)
                .filter(track -> track != null && !track.trim().isEmpty())
                .distinct()
                .toList();
    }

    @Override
    public Session findByIdAndEventId(String sessionId, String eventId) {
        return executeQuerySingle(getCollection()
                .whereEqualTo("id", sessionId)
                .whereEqualTo("eventId", eventId)).orElse(null);
    }

    @Override
    public Session updateScheduleFields(String sessionId, Date start, Date end, String track) {
        try {
            DocumentReference docRef = getCollection().document(sessionId);
            Map<String, Object> updates = new HashMap<>();

            if (start != null) updates.put("start", start);
            if (end != null) updates.put("end", end);
            if (track != null) updates.put("track", track);
            updates.put("updatedAt", new Date());

            docRef.update(updates).get();
            return docRef.get().get().toObject(Session.class);
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to update session", e);
        }
    }

    @Override
    public boolean existsByIdAndEventId(String id, String eventId) {
        return executeQuerySingle(getCollection()
                .whereEqualTo("id", id)
                .whereEqualTo("eventId", eventId)).isPresent();
    }

    @Override
    public boolean deleteSession(String id) {
        return deleteByIdSync(id);
    }

    @Override
    public int deleteByEventId(String eventId) {
        try {
            List<QueryDocumentSnapshot> docs = getCollection()
                    .whereEqualTo("eventId", eventId).get().get().getDocuments();

            if (docs.isEmpty()) return 0;

            WriteBatch batch = firestore.batch();
            docs.forEach(doc -> batch.delete(doc.getReference()));
            batch.commit().get();
            return docs.size();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to batch delete", e);
        }
    }
}
