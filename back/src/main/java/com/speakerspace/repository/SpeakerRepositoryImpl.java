package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.session.Speaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class SpeakerRepositoryImpl extends AbstractFirestoreRepository<Speaker, String>
        implements SpeakerRepository {

    public SpeakerRepositoryImpl(Firestore firestore) {
        super(firestore, Speaker.class, "speakers");
    }

    @Override
    protected DocumentReference getDocumentReference(Speaker speaker) {
        if (speaker.getId() == null || speaker.getId().isEmpty()) {
            DocumentReference docRef = getCollection().document();
            speaker.setId(docRef.getId());
            return docRef;
        }
        return getCollection().document(speaker.getId());
    }

    @Override
    public Speaker saveSpeaker(Speaker speaker) {
        return saveSync(speaker);
    }

    @Override
    public Speaker findSpeakerById(String id) {
        return findByIdSync(id).orElse(null);
    }

    @Override
    public List<Speaker> findByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) return new ArrayList<>();

        List<Speaker> result = new ArrayList<>();
        for (int i = 0; i < ids.size(); i += 10) {
            List<String> batch = ids.subList(i, Math.min(i + 10, ids.size()));
            result.addAll(executeQuery(getCollection().whereIn(FieldPath.documentId(), batch)));
        }
        return result;
    }

    @Override
    public List<Speaker> findByEventId(String eventId) {
        try {
            List<Speaker> speakers = executeQuery(getCollection().whereEqualTo("eventId", eventId));
            log.debug("Found {} speakers for eventId: {}", speakers.size(), eventId);
            return speakers;
        } catch (Exception e) {
            log.error("Failed to find speakers by eventId {}: {}", eventId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    @Override
    public boolean speakerExistsById(String id) {
        return existsByIdSync(id);
    }

    @Override
    public boolean deleteSpeaker(String id) {
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

    @Override
    public List<Speaker> findByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            String normalizedEmail = email.toLowerCase().trim();

            return getCollection()
                    .whereEqualTo("email", normalizedEmail)
                    .get().get().getDocuments().stream()
                    .map(doc -> {
                        Speaker speaker = doc.toObject(Speaker.class);
                        speaker.setId(doc.getId());
                        return speaker;
                    })
                    .collect(Collectors.toList());

        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to find speakers by email: " + email, e);
        }
    }

    @Override
    public List<Speaker> findByEmailAndEventId(String email, String eventId) {
        if (email == null || email.trim().isEmpty() || eventId == null || eventId.trim().isEmpty()) {
            return Collections.emptyList();
        }

        try {
            String normalizedEmail = email.toLowerCase().trim();

            return getCollection()
                    .whereEqualTo("email", normalizedEmail)
                    .whereEqualTo("eventId", eventId)
                    .get().get().getDocuments().stream()
                    .map(doc -> {
                        Speaker speaker = doc.toObject(Speaker.class);
                        speaker.setId(doc.getId());
                        return speaker;
                    })
                    .collect(Collectors.toList());

        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to find speakers by email and eventId", e);
        }
    }
}
