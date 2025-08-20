package com.speakerspace.repository;

import com.google.cloud.firestore.*;
import com.speakerspace.model.Team;
import org.springframework.stereotype.Repository;

import java.util.*;
import java.util.concurrent.ExecutionException;

@Repository
public class TeamRepositoryImpl extends AbstractFirestoreRepository<Team, String>
        implements TeamRepository {

    public TeamRepositoryImpl(Firestore firestore) {
        super(firestore, Team.class, "teams");
    }

    @Override
    protected DocumentReference getDocumentReference(Team team) {
        if (team.getId() == null || team.getId().isEmpty()) {
            DocumentReference docRef = getCollection().document();
            team.setId(docRef.getId());

            if (team.getUrl() == null || team.getUrl().isEmpty()) {
                team.setUrl("https://speaker-space.io/team/" + docRef.getId());
            }

            return docRef;
        }
        return getCollection().document(team.getId());
    }

    @Override
    public Team saveTeam(Team team) {
        return saveSync(team);
    }

    @Override
    public Optional<Team> findTeamByIdOptional(String id) {
        return findByIdSync(id);
    }

    @Override
    public List<Team> findTeamsByMemberId(String memberId) {
        return executeQuery(getCollection().whereArrayContains("memberIds", memberId));
    }

    @Override
    public List<Team> findTeamsByUserCreateId(String userCreateId) {
        return executeQuery(getCollection().whereEqualTo("userCreateId", userCreateId));
    }

    @Override
    public Team findByIdUrl(String url) {
        return executeQuerySingle(getCollection().whereEqualTo("id", url)).orElse(null);
    }

    @Override
    public List<Team> findTeamsByInvitedEmail(String email) {
        try {
            return getCollection().get().get().getDocuments().stream()
                    .map(doc -> {
                        Team team = doc.toObject(Team.class);
                        team.setId(doc.getId());
                        return team;
                    })
                    .filter(team -> team.getInvitedEmails() != null &&
                            team.getInvitedEmails().containsKey(email))
                    .toList();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to find teams by invited email", e);
        }
    }

    @Override
    public boolean existsByName(String name) {
        try {
            return !getCollection().whereEqualTo("name", name).get().get().isEmpty();
        } catch (InterruptedException | ExecutionException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to check team name existence", e);
        }
    }

    @Override
    public void deleteTeam(String id) {
        deleteByIdSync(id);
    }
}
