package com.speakerspace.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private Firestore firestore;

    @Mock
    private CollectionReference collectionReference;

    @Mock
    private DocumentReference documentReference;

    @Mock
    private ApiFuture<WriteResult> writeResultFuture;

    @Mock
    private ApiFuture<DocumentSnapshot> documentSnapshotFuture;

    @Mock
    private DocumentSnapshot documentSnapshot;

    private User testUser;
    private UserDTO testUserDTO;
    private final String TEST_UID = "test-uid-123";
    private final String COLLECTION_NAME = "users";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUid(TEST_UID);
        testUser.setDisplayName("Test User");
        testUser.setEmail("test@example.com");

        testUserDTO = new UserDTO();
        testUserDTO.setUid(TEST_UID);
        testUserDTO.setDisplayName("Test User");
        testUserDTO.setEmail("test@example.com");
    }

    @Test
    void saveUser_NewUser_ShouldSaveAndReturnUser() {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);
            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);

            // Mock
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(null);

            // Mapper
            when(userMapper.convertToEntity(testUserDTO)).thenReturn(testUser);
            when(userMapper.convertToDTO(testUser)).thenReturn(testUserDTO);

            // When
            UserDTO savedUserDTO = userService.saveUser(testUserDTO);

            // Then
            assertNotNull(savedUserDTO);
            assertEquals(TEST_UID, savedUserDTO.getUid());
            assertEquals("Test User", savedUserDTO.getDisplayName());
            assertEquals("test@example.com", savedUserDTO.getEmail());

            verify(userMapper).convertToEntity(testUserDTO);
            verify(userMapper).convertToDTO(testUser);
            verify(firestore, times(2)).collection(COLLECTION_NAME);
            verify(collectionReference, times(2)).document(TEST_UID);
            verify(documentReference).set(testUser);
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void saveUser_ExistingUser_ShouldUpdateAndReturnUser() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            User existingUser = new User();
            existingUser.setUid(TEST_UID);
            existingUser.setDisplayName("Existing User");
            existingUser.setEmail("existing@example.com");
            existingUser.setCompany("Test Company");

            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);
            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);

            // Mock
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(existingUser);

            // Mapper
            when(userMapper.convertToEntity(testUserDTO)).thenReturn(testUser);
            when(userMapper.convertToDTO(any(User.class))).thenReturn(testUserDTO);

            // When
            UserDTO savedUserDTO = userService.saveUser(testUserDTO);

            // Then
            assertNotNull(savedUserDTO);
            assertEquals(TEST_UID, savedUserDTO.getUid());

            verify(userMapper).convertToEntity(testUserDTO);
            verify(userMapper).convertToDTO(any(User.class));
            verify(firestore, times(2)).collection(COLLECTION_NAME);
            verify(collectionReference, times(2)).document(TEST_UID);
            verify(documentReference).set(any(User.class));
        }
    }

    @Test
    void saveUser_WhenFirestoreThrowsException_ShouldThrowRuntimeException() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);

            // Mock
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(null);
            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);
            when(writeResultFuture.get()).thenThrow(new InterruptedException("Test exception"));

            // Mapper
            when(userMapper.convertToEntity(testUserDTO)).thenReturn(testUser);

            // When & Then
            assertThrows(RuntimeException.class, () -> userService.saveUser(testUserDTO));

            verify(userMapper).convertToEntity(testUserDTO);
            verify(firestore, times(2)).collection(COLLECTION_NAME);
            verify(collectionReference, times(2)).document(TEST_UID);
            verify(documentReference).set(testUser);
        }
    }

    @Test
    void getUserByUid_ExistingUser_ShouldReturnUser() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(testUser);

            // Mapper
            when(userMapper.convertToDTO(testUser)).thenReturn(testUserDTO);

            // When
            UserDTO returnedUserDTO = userService.getUserByUid(TEST_UID);

            // Then
            assertNotNull(returnedUserDTO);
            assertEquals(TEST_UID, returnedUserDTO.getUid());

            verify(userMapper).convertToDTO(testUser);
            verify(firestore).collection(COLLECTION_NAME);
            verify(collectionReference).document(TEST_UID);
            verify(documentReference).get();
        }
    }

    @Test
    void getUserByUid_NonExistingUser_ShouldReturnNull() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            String nonExistingUid = "non-existing-uid";
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(nonExistingUid)).thenReturn(documentReference);
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(null);

            // Mapper
            when(userMapper.convertToDTO(null)).thenReturn(null);

            // When
            UserDTO returnedUserDTO = userService.getUserByUid(nonExistingUid);

            // Then
            assertNull(returnedUserDTO);

            verify(userMapper).convertToDTO(null);
            verify(firestore).collection(COLLECTION_NAME);
            verify(collectionReference).document(nonExistingUid);
        }
    }

    @Test
    void getUserByUid_WhenFirestoreThrowsException_ShouldReturnNull() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenThrow(new InterruptedException("Test exception"));

            // Mapper
            when(userMapper.convertToDTO(null)).thenReturn(null);

            // When
            UserDTO returnedUserDTO = userService.getUserByUid(TEST_UID);

            // Then
            assertNull(returnedUserDTO);

            verify(userMapper).convertToDTO(null);
            verify(firestore).collection(COLLECTION_NAME);
            verify(collectionReference).document(TEST_UID);
        }
    }

    @Test
    void updateUser_ExistingUser_ShouldUpdateAndReturnUser() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            User existingUser = new User();
            existingUser.setUid(TEST_UID);
            existingUser.setDisplayName("Existing User");

            User updatedUser = new User();
            updatedUser.setUid(TEST_UID);
            updatedUser.setDisplayName("Updated User");

            UserDTO updatedUserDTO = new UserDTO();
            updatedUserDTO.setUid(TEST_UID);
            updatedUserDTO.setDisplayName("Updated User");

            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);

            // Mock
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(existingUser);

            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);

            // Mapper
            when(userMapper.updateEntityFromDTO(testUserDTO, existingUser)).thenReturn(updatedUser);
            when(userMapper.convertToDTO(updatedUser)).thenReturn(updatedUserDTO);

            // When
            UserDTO result = userService.updateUser(testUserDTO);

            // Then
            assertNotNull(result);
            assertEquals("Updated User", result.getDisplayName());

            verify(userMapper).updateEntityFromDTO(testUserDTO, existingUser);
            verify(userMapper).convertToDTO(updatedUser);
            verify(firestore, times(2)).collection(COLLECTION_NAME);
            verify(collectionReference, times(2)).document(TEST_UID);
            verify(documentReference).set(updatedUser);
        }
    }

    @Test
    void updateUser_NonExistingUser_ShouldReturnNull() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);

            // Mock
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(null);

            // When
            UserDTO result = userService.updateUser(testUserDTO);

            // Then
            assertNull(result);

            verify(firestore).collection(COLLECTION_NAME);
            verify(collectionReference).document(TEST_UID);
            verify(userMapper, never()).updateEntityFromDTO(any(), any());
            verify(documentReference, never()).set(any());
        }
    }

    @Test
    void updateUser_WhenFirestoreThrowsException_ShouldThrowRuntimeException() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            // Given
            User existingUser = new User();
            existingUser.setUid(TEST_UID);

            User updatedUser = new User();
            updatedUser.setUid(TEST_UID);

            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection(COLLECTION_NAME)).thenReturn(collectionReference);
            when(collectionReference.document(TEST_UID)).thenReturn(documentReference);

            // Mock
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(existingUser);
            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);
            when(writeResultFuture.get()).thenThrow(new InterruptedException("Test exception"));
            when(userMapper.updateEntityFromDTO(testUserDTO, existingUser)).thenReturn(updatedUser);

            // When & Then
            assertThrows(RuntimeException.class, () -> userService.updateUser(testUserDTO));

            verify(userMapper).updateEntityFromDTO(testUserDTO, existingUser);
            verify(firestore, times(2)).collection(COLLECTION_NAME);
            verify(collectionReference, times(2)).document(TEST_UID);
            verify(documentReference).set(updatedUser);
        }
    }
}