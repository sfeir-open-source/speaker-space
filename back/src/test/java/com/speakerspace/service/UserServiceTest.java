package com.speakerspace.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @InjectMocks
    private UserService userService;

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

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUid("test-uid-123");
        testUser.setDisplayName("Test User");
        testUser.setEmail("test@example.com");
    }

    @Test
    void saveUser_NewUser_ShouldSaveAndReturnUser() {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {

            UserService spyUserService = spy(userService);

            doReturn(null).when(spyUserService).getUserByUid(testUser.getUid());

            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);

            when(firestore.collection("users")).thenReturn(collectionReference);

            when(collectionReference.document(anyString())).thenReturn(documentReference);

            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);

            User savedUser = spyUserService.saveUser(testUser);

            assertNotNull(savedUser);

            assertEquals(testUser.getUid(), savedUser.getUid());

            assertEquals(testUser.getDisplayName(), savedUser.getDisplayName());

            assertEquals(testUser.getEmail(), savedUser.getEmail());

            verify(firestore).collection("users");

            verify(collectionReference).document(testUser.getUid());

            verify(documentReference).set(testUser);
        }
    }

    @Test
    void saveUser_ExistingUser_ShouldUpdateAndReturnUser() {
        // Given
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            UserService spyUserService = spy(userService);

            doReturn(testUser).when(spyUserService).getUserByUid(testUser.getUid());

            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);
            when(firestore.collection("users")).thenReturn(collectionReference);
            when(collectionReference.document(anyString())).thenReturn(documentReference);
            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);

            User savedUser = spyUserService.saveUser(testUser);

            assertNotNull(savedUser);
            assertEquals(testUser.getUid(), savedUser.getUid());

            verify(firestore).collection("users");
            verify(collectionReference).document(testUser.getUid());
            verify(documentReference).set(testUser);
        }
    }

    @Test
    void saveUser_WhenFirestoreThrowsException_ShouldThrowRuntimeException() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);

            when(firestore.collection("users")).thenReturn(collectionReference);
            when(collectionReference.document(anyString())).thenReturn(documentReference);

            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(null);

            when(documentReference.set(any(User.class))).thenReturn(writeResultFuture);
            when(writeResultFuture.get()).thenThrow(new InterruptedException("Test exception"));

            assertThrows(RuntimeException.class, () -> userService.saveUser(testUser));
        }
    }

    @Test
    void getUserByUid_ExistingUser_ShouldReturnUser() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);

            when(firestore.collection("users")).thenReturn(collectionReference);
            when(collectionReference.document(anyString())).thenReturn(documentReference);
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(testUser);

            User returnedUser = userService.getUserByUid("test-uid-123");

            assertNotNull(returnedUser);
            assertEquals(testUser.getUid(), returnedUser.getUid());

            verify(firestore).collection("users");
            verify(collectionReference).document("test-uid-123");
            verify(documentReference).get();
        }
    }

    @Test
    void getUserByUid_NonExistingUser_ShouldReturnNull() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);

            when(firestore.collection("users")).thenReturn(collectionReference);
            when(collectionReference.document(anyString())).thenReturn(documentReference);
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenReturn(documentSnapshot);
            when(documentSnapshot.toObject(User.class)).thenReturn(null);

            User returnedUser = userService.getUserByUid("non-existing-uid");

            assertNull(returnedUser);

            verify(firestore).collection("users");
            verify(collectionReference).document("non-existing-uid");
        }
    }

    @Test
    void getUserByUid_WhenFirestoreThrowsException_ShouldReturnNull() throws ExecutionException, InterruptedException {
        try (MockedStatic<FirestoreClient> mockedFirestoreClient = mockStatic(FirestoreClient.class)) {
            mockedFirestoreClient.when(FirestoreClient::getFirestore).thenReturn(firestore);

            when(firestore.collection("users")).thenReturn(collectionReference);
            when(collectionReference.document(anyString())).thenReturn(documentReference);
            when(documentReference.get()).thenReturn(documentSnapshotFuture);
            when(documentSnapshotFuture.get()).thenThrow(new InterruptedException("Test exception"));

            User returnedUser = userService.getUserByUid("test-uid-123");

            assertNull(returnedUser);
        }
    }
}
