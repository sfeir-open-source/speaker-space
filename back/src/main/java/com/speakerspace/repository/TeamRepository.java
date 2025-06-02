package com.speakerspace.repository;

import com.speakerspace.model.Team;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository {
    Team save(Team team);
    Optional<Team> findById(String id);
    List<Team> findTeamsByMemberId(String memberId);
    List<Team> findTeamsByUserCreateId(String userCreateId);
    Team findByIdUrl(String url);
    void delete(String id);
    List<Team> findTeamsByInvitedEmail(String email);
}
