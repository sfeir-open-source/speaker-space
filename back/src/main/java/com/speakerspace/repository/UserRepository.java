package com.speakerspace.repository;

import com.speakerspace.model.User;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository {
    Optional<User> findById(String id);

}
