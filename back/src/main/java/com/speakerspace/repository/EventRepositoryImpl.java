package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.Event;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Repository
public class EventRepositoryImpl extends AbstractFirestoreRepository<Event, String>
        implements EventRepository {

    public EventRepositoryImpl(Firestore firestore) {
        super(firestore, Event.class, "events");
    }

    @Override
    protected DocumentReference getDocumentReference(Event event) {
        if (event.getIdEvent() == null || event.getIdEvent().isEmpty()) {
            DocumentReference docRef = getCollection().document();
            event.setIdEvent(docRef.getId());
            return docRef;
        }
        return getCollection().document(event.getIdEvent());
    }

    public Event saveEvent(Event event) {
        return saveSync(event);
    }

    public Event findEventById(String id) {
        return findByIdSync(id).orElse(null);
    }

    public Event findByUrl(String url) {
        return executeQuerySingle(getCollection().whereEqualTo("url", url)).orElse(null);
    }

    public List<Event> findByTeamId(String teamId) {
        return executeQuery(getCollection().whereEqualTo("teamId", teamId));
    }

    public List<Event> findByUserCreateId(String userId) {
        return executeQuery(getCollection().whereEqualTo("userCreateId", userId));
    }

    public boolean existsByEventNameAndTeamId(String eventName, String teamId) {
        try {
            return !getCollection()
                    .whereEqualTo("eventName", eventName)
                    .whereEqualTo("teamId", teamId)
                    .get().get().isEmpty();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to check existence", e);
        }
    }

    public boolean existsByEventNameAndTeamIdAndIdEventNot(String eventName, String teamId, String excludeEventId) {
        try {
            return getCollection()
                    .whereEqualTo("eventName", eventName)
                    .whereEqualTo("teamId", teamId)
                    .get().get().getDocuments().stream()
                    .anyMatch(doc -> !doc.getId().equals(excludeEventId));
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to check existence", e);
        }
    }

    public boolean deleteEvent(String id) {
        return deleteByIdSync(id);
    }

    public int deleteByTeamId(String teamId) {
        try {
            List<QueryDocumentSnapshot> docs = getCollection()
                    .whereEqualTo("teamId", teamId).get().get().getDocuments();

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
