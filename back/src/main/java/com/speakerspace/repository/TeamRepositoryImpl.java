package com.speakerspace.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.WriteResult;
import com.speakerspace.model.Team;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class TeamRepositoryImpl implements TeamRepository {

    private static final Logger logger = LoggerFactory.getLogger(TeamRepositoryImpl.class);
    private static final String COLLECTION_NAME = "teams";

    private final Firestore firestore;

    public TeamRepositoryImpl(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public Team save(Team team) {
        try {
            DocumentReference docRef;

            if (team.getId() == null || team.getId().isEmpty()) {
                docRef = firestore.collection(COLLECTION_NAME).document();
                team.setId(docRef.getId());
            } else {
                docRef = firestore.collection(COLLECTION_NAME).document(team.getId());
            }

            ApiFuture<WriteResult> result = docRef.set(team);
            result.get();

            logger.info("Team saved with ID: {}", team.getId());
            return team;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error saving team: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save team", e);
        }
    }


    @Override
    public Optional<Team> findById(String id) {
        try {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();

            if (document.exists()) {
                Team team = document.toObject(Team.class);
                return Optional.ofNullable(team);
            } else {
                return Optional.empty();
            }
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding team by ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find team", e);
        }
    }
}
