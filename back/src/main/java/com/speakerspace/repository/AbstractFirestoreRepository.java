package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@RequiredArgsConstructor
public abstract class AbstractFirestoreRepository<T, ID> {

    protected final Firestore firestore;
    private final Class<T> entityClass;
    private final String collectionName;

    protected CollectionReference getCollection() {
        return firestore.collection(collectionName);
    }

    protected abstract DocumentReference getDocumentReference(T entity);

    public T saveSync(T entity) {
        try {
            getDocumentReference(entity).set(entity).get();
            return entity;
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to save entity", e);
        }
    }

    public Optional<T> findByIdSync(ID id) {
        try {
            DocumentSnapshot doc = getCollection().document(id.toString()).get().get();
            return doc.exists() ? Optional.ofNullable(doc.toObject(entityClass)) : Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to find entity", e);
        }
    }

    public boolean deleteByIdSync(ID id) {
        try {
            getCollection().document(id.toString()).delete().get();
            return true;
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to delete entity", e);
        }
    }

    public boolean existsByIdSync(ID id) {
        try {
            return getCollection().document(id.toString()).get().get().exists();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to check existence", e);
        }
    }

    protected List<T> executeQuery(Query query) {
        try {
            return query.get().get().getDocuments().stream()
                    .map(doc -> doc.toObject(entityClass))
                    .toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to execute query", e);
        }
    }

    protected Optional<T> executeQuerySingle(Query query) {
        try {
            List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();
            return docs.isEmpty() ? Optional.empty() :
                    Optional.of(docs.getFirst().toObject(entityClass));
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to execute query", e);
        }
    }
}

