package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.Team;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
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

            docRef.set(team).get();
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
            DocumentSnapshot document = docRef.get().get();

            return document.exists()
                    ? Optional.ofNullable(document.toObject(Team.class))
                    : Optional.empty();
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding team by ID: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find team", e);
        }
    }

    @Override
    public List<Team> findTeamsByMemberId(String memberId) {
        return executeQuery(
                firestore.collection(COLLECTION_NAME)
                        .whereArrayContains("memberIds", memberId)
        );
    }

    @Override
    public List<Team> findTeamsByUserCreateId(String userCreateId) {
        return executeQuery(
                firestore.collection(COLLECTION_NAME)
                        .whereEqualTo("userCreateId", userCreateId)
        );
    }

    @Override
    public Team findByUrl(String url) {
        try {
            logger.info("Searching for team with URL: {}", url);

            List<QueryDocumentSnapshot> documents = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("url", url)
                    .get().get().getDocuments();

            if (documents.isEmpty()) {
                logger.info("No team found with URL: {}", url);
                return null;
            }

            logger.info("Team found with URL: {}", url);
            return documents.get(0).toObject(Team.class);
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error finding team by URL: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to find team by URL", e);
        }
    }

    @Override
    public void delete(String id) {
        try {
            firestore.collection(COLLECTION_NAME).document(id).delete().get();
            logger.info("Team deleted with ID: {}", id);
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error deleting team: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete team", e);
        }
    }

    private List<Team> executeQuery(Query query) {
        try {
            List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();
            List<Team> teams = new ArrayList<>();

            for (QueryDocumentSnapshot document : documents) {
                teams.add(document.toObject(Team.class));
            }

            return teams;
        } catch (InterruptedException | ExecutionException e) {
            logger.error("Error executing query: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to execute query", e);
        }
    }
}
