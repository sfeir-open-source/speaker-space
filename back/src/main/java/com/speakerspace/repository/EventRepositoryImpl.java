package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Repository
public class EventRepositoryImpl implements EventRepository {

    private static final Logger logger = LoggerFactory.getLogger(EventRepositoryImpl.class);
    private static final String COLLECTION_NAME = "events";
    private final Firestore firestore;

    public EventRepositoryImpl(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Event save(Event event) {
        try {
            DocumentReference docRef;

            if (event.getIdEvent() == null || event.getIdEvent().isEmpty()) {
                docRef = firestore.collection(COLLECTION_NAME).document();
                event.setIdEvent(docRef.getId());
            } else {
                docRef = firestore.collection(COLLECTION_NAME).document(event.getIdEvent());
            }

            docRef.set(event).get();
            return event;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error saving event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save event", e);
        }
    }

    @Override
    public Event findById(String id) {
        try {
            DocumentSnapshot document = firestore.collection(COLLECTION_NAME).document(id).get().get();
            if (document.exists()) {
                return document.toObject(Event.class);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding event by ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find event", e);
        }
    }

    @Override
    public Event findByUrl(String url) {
        try {
            Query query = firestore.collection(COLLECTION_NAME).whereEqualTo("url", url);
            QuerySnapshot querySnapshot = query.get().get();

            if (!querySnapshot.isEmpty()) {
                return querySnapshot.getDocuments().get(0).toObject(Event.class);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding event by URL: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find event by URL", e);
        }
    }

    @Override
    public List<Event> findByTeamId(String teamId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME).whereEqualTo("teamId", teamId);
            QuerySnapshot querySnapshot = query.get().get();

            return querySnapshot.getDocuments().stream()
                    .map(doc -> {
                        Event event = doc.toObject(Event.class);
                        event.setIdEvent(doc.getId());
                        return event;
                    })
                    .collect(Collectors.toList());

        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding events by team ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find events by team ID", e);
        }
    }

    @Override
    public List<Event> findByUserCreateId(String userId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME).whereEqualTo("userCreateId", userId);
            QuerySnapshot querySnapshot = query.get().get();

            List<Event> events = new ArrayList<>();
            querySnapshot.getDocuments().forEach(doc -> {
                events.add(doc.toObject(Event.class));
            });

            return events;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding events by user ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find events by user ID", e);
        }
    }

    @Override
    public boolean existsByEventNameAndTeamId(String eventName, String teamId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("eventName", eventName)
                    .whereEqualTo("teamId", teamId);

            QuerySnapshot querySnapshot = query.get().get();
            return !querySnapshot.isEmpty();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error checking event name uniqueness: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to check event name uniqueness", e);
        }
    }

    @Override
    public boolean existsByEventNameAndTeamIdAndIdEventNot(String eventName, String teamId, String excludeEventId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("eventName", eventName)
                    .whereEqualTo("teamId", teamId);

            QuerySnapshot querySnapshot = query.get().get();

            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                String documentId = document.getId();
                if (!documentId.equals(excludeEventId)) {
                    return true;
                }
            }

            return false;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error checking event name uniqueness for update: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to check event name uniqueness for update", e);
        }
    }

    @Override
    public boolean delete(String id) {
        try {
            firestore.collection(COLLECTION_NAME).document(id).delete().get();
            return true;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to delete event", e);
        }
    }

    @Override
    public int deleteByTeamId(String teamId) {
        try {
            Query query = firestore.collection(COLLECTION_NAME).whereEqualTo("teamId", teamId);
            QuerySnapshot querySnapshot = query.get().get();

            List<QueryDocumentSnapshot> documents = querySnapshot.getDocuments();

            if (documents.isEmpty()) {
                logger.info("No events found for team ID: {}", teamId);
                return 0;
            }

            WriteBatch batch = firestore.batch();

            for (QueryDocumentSnapshot document : documents) {
                batch.delete(document.getReference());
            }

            batch.commit().get();

            int deletedCount = documents.size();
            logger.info("Batch deleted {} events for team ID: {}", deletedCount, teamId);
            return deletedCount;

        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error batch deleting events by team ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to batch delete events by team ID", e);
        }
    }
}
