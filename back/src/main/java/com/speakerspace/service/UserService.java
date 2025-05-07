package com.speakerspace.service;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.speakerspace.dto.TeamMemberDTO;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.model.Team;
import com.speakerspace.model.TeamMember;
import com.speakerspace.model.User;
import com.speakerspace.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final String COLLECTION_NAME = "users";

    private final UserMapper userMapper;
    private final Firestore firestore;
    private final TeamRepository teamRepository;

    @Autowired
    public UserService(UserMapper userMapper, Firestore firestore, TeamRepository teamRepository) {
        this.userMapper = userMapper;
        this.firestore = firestore;
        this.teamRepository = teamRepository;
    }

    public UserDTO saveUser(UserDTO userDTO) {
        try {
            User userToSave = userMapper.convertToEntity(userDTO);

            Firestore firestore = FirestoreClient.getFirestore();
            CollectionReference usersCollection = firestore.collection(COLLECTION_NAME);

            User existingUser = getUserEntityByUid(userDTO.getUid());

            if (existingUser != null) {

                userToSave = preserveExistingFields(userToSave, existingUser);
            } else {
                logger.info("Creating new user: {}", userDTO.getUid());
            }

            usersCollection.document(userToSave.getUid()).set(userToSave).get();

            return userMapper.convertToDTO(userToSave);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to save user", e);
        }
    }

    private User preserveExistingFields(User newUser, User existingUser) {
        if (existingUser.getDisplayName() != null && !existingUser.getDisplayName().isEmpty()) {
            newUser.setDisplayName(existingUser.getDisplayName());
        }

        if (existingUser.getPhotoURL() != null && !existingUser.getPhotoURL().isEmpty()) {
            newUser.setPhotoURL(existingUser.getPhotoURL());
        }

        if (existingUser.getEmail() != null && !existingUser.getEmail().isEmpty()) {
            newUser.setEmail(existingUser.getEmail());
        }

        if (newUser.getCompany() == null) newUser.setCompany(existingUser.getCompany());
        if (newUser.getCity() == null) newUser.setCity(existingUser.getCity());
        if (newUser.getPhoneNumber() == null) newUser.setPhoneNumber(existingUser.getPhoneNumber());
        if (newUser.getGithubLink() == null) newUser.setGithubLink(existingUser.getGithubLink());
        if (newUser.getTwitterLink() == null) newUser.setTwitterLink(existingUser.getTwitterLink());
        if (newUser.getBlueSkyLink() == null) newUser.setBlueSkyLink(existingUser.getBlueSkyLink());
        if (newUser.getLinkedInLink() == null) newUser.setLinkedInLink(existingUser.getLinkedInLink());
        if (newUser.getBiography() == null) newUser.setBiography(existingUser.getBiography());
        if (newUser.getOtherLink() == null) newUser.setOtherLink(existingUser.getOtherLink());

        return newUser;
    }

    public UserDTO getUserByUid(String uid) {
        User user = getUserEntityByUid(uid);
        if (user == null) {
            return null;
        }
        return userMapper.convertToDTO(user);
    }

    private User getUserEntityByUid(String uid) {
        try {
            Firestore firestore = FirestoreClient.getFirestore();
            DocumentSnapshot document = firestore.collection(COLLECTION_NAME)
                    .document(uid)
                    .get()
                    .get();

            if (!document.exists()) {
                return null;
            }

            return document.toObject(User.class);
        } catch (InterruptedException | ExecutionException e) {
            return null;
        }
    }

    public UserDTO updateUser(UserDTO userDTO) {
        try {
            User existingUser = getUserEntityByUid(userDTO.getUid());
            if (existingUser == null) {
                return null;
            }

            User updatedUser = userMapper.updateEntityFromDTO(userDTO, existingUser);

            Firestore firestore = FirestoreClient.getFirestore();
            firestore.collection(COLLECTION_NAME)
                    .document(updatedUser.getUid())
                    .set(updatedUser)
                    .get();

            return userMapper.convertToDTO(updatedUser);
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to update user: " + e.getMessage(), e);
        }
    }

    public List<TeamMemberDTO> searchUsersByEmail(String emailQuery) {
        String normalizedQuery = emailQuery.toLowerCase();

        try {
            QuerySnapshot querySnapshot = firestore.collection("users")
                    .whereGreaterThanOrEqualTo("email", normalizedQuery)
                    .whereLessThanOrEqualTo("email", normalizedQuery + "\uf8ff")
                    .limit(10)
                    .get()
                    .get();

            List<TeamMemberDTO> results = new ArrayList<>();

            for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                User user = doc.toObject(User.class);
                if (user != null && user.getEmail() != null) {
                    TeamMemberDTO memberDTO = new TeamMemberDTO();
                    memberDTO.setUserId(doc.getId());
                    memberDTO.setDisplayName(user.getDisplayName());
                    memberDTO.setPhotoURL(user.getPhotoURL());
                    memberDTO.setEmail(user.getEmail());
                    results.add(memberDTO);
                }
            }

            return results;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to search users", e);
        }
    }

    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())) {
            String userId = authentication.getName();
            return userId;
        }
        throw new IllegalStateException("No authenticated user found");
    }

    public UserDTO getUserByEmail(String email) {
        try {
            List<QueryDocumentSnapshot> documents = firestore.collection("users")
                    .whereEqualTo("email", email)
                    .get().get().getDocuments();

            if (documents.isEmpty()) {
                return null;
            }

            User user = documents.get(0).toObject(User.class);
            return userMapper.convertToDTO(user);
        } catch (Exception e) {
            logger.error("Error getting user by email", e);
            return null;
        }
    }

    public void processUserLogin(String email, String uid) {
        if (email == null || uid == null) {
            logger.error("Email or UID is null");
            return;
        }

        email = email.toLowerCase();

        List<Team> teamsWithInvitation = teamRepository.findTeamsByInvitedEmail(email);

        for (Team team : teamsWithInvitation) {
            String temporaryUserId = team.getTemporaryUserIdByEmail(email);
            if (temporaryUserId != null) {
                team.updateMemberId(temporaryUserId, uid);

                for (TeamMember member : team.getMembers()) {
                    if (member.getUserId().equals(uid)) {
                        member.setStatus("active");
                        break;
                    }
                }

                team.removeInvitedEmail(email);
                teamRepository.save(team);
            }
        }
    }
}