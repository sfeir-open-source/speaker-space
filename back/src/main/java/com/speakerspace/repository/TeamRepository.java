package com.speakerspace.repository;

import com.speakerspace.model.Team;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository {
    Team saveTeam(Team team);
    Optional<Team> findTeamByIdOptional(String id);
    List<Team> findTeamsByMemberId(String memberId);
    List<Team> findTeamsByUserCreateId(String userCreateId);
    Team findByIdUrl(String url);
    List<Team> findTeamsByInvitedEmail(String email);
    boolean existsByName(String name);
    void deleteTeam(String id);
}
