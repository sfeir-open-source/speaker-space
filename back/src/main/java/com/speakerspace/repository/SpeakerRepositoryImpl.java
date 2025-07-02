package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.session.Speaker;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@Repository
public class SpeakerRepositoryImpl implements SpeakerRepository {

    private static final String COLLECTION_NAME = "speakers";

    @Autowired
    private Firestore firestore;

    @Override
    public Speaker save(Speaker speaker) {
        return executeFirestoreOperation(() -> {
            DocumentReference docRef = getDocumentReference(speaker);
            try {
                docRef.set(speaker).get();
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Failed to save speaker", e);
            }
            return speaker;
        });
    }

    @Override
    public Speaker findById(String id) {
        return executeFirestoreOperation(() -> {
            try {
                DocumentSnapshot document = firestore.collection(COLLECTION_NAME).document(id).get().get();
                return document.exists() ? document.toObject(Speaker.class) : null;
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Failed to find speaker", e);
            }
        });
    }

    @Override
    public List<Speaker> findByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }

        return executeFirestoreOperation(() -> {
            try {
                List<Speaker> allSpeakers = new ArrayList<>();
                List<List<String>> batches = createBatches(ids, 10);

                for (List<String> batch : batches) {
                    Query query = firestore.collection(COLLECTION_NAME).whereIn("id", batch);
                    QuerySnapshot querySnapshot = query.get().get();

                    List<Speaker> batchSpeakers = querySnapshot.getDocuments().stream()
                            .map(doc -> doc.toObject(Speaker.class))
                            .collect(Collectors.toList());

                    allSpeakers.addAll(batchSpeakers);
                }

                return allSpeakers;
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Failed to find speakers by IDs", e);
            }
        });
    }

    @Override
    public List<Speaker> findByEventId(String eventId) {
        return executeFirestoreOperation(() -> {
            try {
                Query query = firestore.collection(COLLECTION_NAME).whereEqualTo("eventId", eventId);
                QuerySnapshot querySnapshot = query.get().get();

                return querySnapshot.getDocuments().stream()
                        .map(doc -> doc.toObject(Speaker.class))
                        .collect(Collectors.toList());
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Failed to find speakers by event ID", e);
            }
        });
    }

    @Override
    public boolean existsById(String id) {
        return executeFirestoreOperation(() -> {
            try {
                DocumentSnapshot document = firestore.collection(COLLECTION_NAME).document(id).get().get();
                return document.exists();
            } catch (InterruptedException | ExecutionException e) {
                throw new RuntimeException("Failed to check speaker existence", e);
            }
        });
    }

    @Override
    public boolean delete(String id) {
        try {
            firestore.collection(COLLECTION_NAME).document(id).delete().get();
            return true;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to delete Speaker", e);
        }
    }

    private DocumentReference getDocumentReference(Speaker speaker) {
        if (speaker.getId() == null || speaker.getId().isEmpty()) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
            speaker.setId(docRef.getId());
            return docRef;
        }
        return firestore.collection(COLLECTION_NAME).document(speaker.getId());
    }

    private <T> List<List<T>> createBatches(List<T> list, int batchSize) {
        List<List<T>> batches = new ArrayList<>();
        for (int i = 0; i < list.size(); i += batchSize) {
            batches.add(list.subList(i, Math.min(i + batchSize, list.size())));
        }
        return batches;
    }

    private <T> T executeFirestoreOperation(Supplier<T> operation) {
        return operation.get();
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
            throw new RuntimeException("Failed to batch delete speakers by event ID", e);
        }
    }
}
