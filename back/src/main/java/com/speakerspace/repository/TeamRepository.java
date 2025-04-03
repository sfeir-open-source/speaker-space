package com.speakerspace.repository;

import com.speakerspace.model.Team;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository {
    Team save(Team team);
    Optional<Team> findById(String id);
}
