package com.speakerspace.repository;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.speakerspace.model.Event;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.concurrent.ExecutionException;

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

            if (event.getId() == null || event.getId().isEmpty()) {
                docRef = firestore.collection(COLLECTION_NAME).document();
                event.setId(docRef.getId());
            } else {
                docRef = firestore.collection(COLLECTION_NAME).document(event.getId());
            }

            docRef.set(event).get();
            logger.info("Event saved with ID: {}", event.getId());
            return event;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error saving event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save event", e);
        }
    }
}
