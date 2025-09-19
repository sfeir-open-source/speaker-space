package com.speakerspace.repository;

import com.speakerspace.model.User;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository {
    User saveUser(User user);
    User findUserById(String uid);
    Optional<User> findUserByIdOptional(String uid);
    Optional<User> findByEmail(String email);
    List<User> searchUsersByEmail(String emailQuery, int limit);
}
