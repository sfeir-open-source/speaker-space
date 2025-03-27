package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.model.User;
import com.speakerspace.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private CookieService cookieService;

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private AuthController authController;

    private User testUser;
    private FirebaseTokenRequest tokenRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUid("test-uid-123");
        testUser.setDisplayName("Test User");
        testUser.setEmail("test@example.com");
        testUser.setPhotoURL("https://example.com/photo.jpg");

        tokenRequest = new FirebaseTokenRequest();
        tokenRequest.idToken = "valid-token-123";

        when(firebaseToken.getUid()).thenReturn(testUser.getUid());
        when(firebaseToken.getEmail()).thenReturn(testUser.getEmail());
        when(firebaseToken.getName()).thenReturn(testUser.getDisplayName());
        when(firebaseToken.getPicture()).thenReturn(testUser.getPhotoURL());
    }

    @Test
    void login_WithValidTokenAndExistingUser_ShouldReturnUser() throws Exception {
        when(firebaseAuth.verifyIdToken(anyString())).thenReturn(firebaseToken);
        when(userService.getUserByUid(anyString())).thenReturn(testUser);

        ResponseEntity<?> responseEntity = authController.login(tokenRequest, this.response);

        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(testUser, responseEntity.getBody());

        verify(firebaseAuth).verifyIdToken(anyString());
        verify(cookieService).setAuthCookie(any(), anyString());
        verify(userService).getUserByUid(anyString());
        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void login_WithValidTokenAndNewUser_ShouldCreateAndReturnUser() throws Exception {
        when(firebaseAuth.verifyIdToken(anyString())).thenReturn(firebaseToken);
        when(userService.getUserByUid(anyString())).thenReturn(null);
        when(userService.saveUser(any(User.class))).thenReturn(testUser);

        ResponseEntity<?> response = authController.login(tokenRequest, this.response);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());

        verify(firebaseAuth).verifyIdToken(anyString());
        verify(cookieService).setAuthCookie(any(), anyString());
        verify(userService).getUserByUid(anyString());
        verify(userService).saveUser(any(User.class));
    }

    @Test
    void login_WithInvalidToken_ShouldReturnUnauthorized() throws Exception {
        when(firebaseAuth.verifyIdToken(anyString()))
                .thenThrow(new IllegalArgumentException("Invalid token"));

        ResponseEntity<?> response = authController.login(tokenRequest, this.response);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());

        verify(firebaseAuth).verifyIdToken(anyString());
        verify(cookieService, never()).setAuthCookie(any(), anyString());
        verify(userService, never()).getUserByUid(anyString());
        verify(userService, never()).saveUser(any(User.class));
    }

    @Test
    void login_WithNoToken_ShouldReturnBadRequest() {
        FirebaseTokenRequest emptyRequest = new FirebaseTokenRequest();
        emptyRequest.idToken = null;

        ResponseEntity<?> responseEntity = authController.login(emptyRequest, this.response);

        assertEquals(HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());
        assertEquals("No token provided", responseEntity.getBody());

        verifyNoInteractions(firebaseAuth);
        verifyNoInteractions(userService);
        verifyNoInteractions(cookieService);
    }

    @Test
    void createUser_ShouldSaveAndReturnUser() {
        when(userService.saveUser(any(User.class))).thenReturn(testUser);

        ResponseEntity<?> response = authController.createUser(testUser);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());

        verify(userService).saveUser(any(User.class));
    }

    @Test
    void getUserByUid_ExistingUser_ShouldReturnUser() {
        when(userService.getUserByUid(anyString())).thenReturn(testUser);

        ResponseEntity<?> response = authController.getUserByUid(testUser.getUid());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(testUser, response.getBody());

        verify(userService).getUserByUid(anyString());
    }

    @Test
    void getUserByUid_NonExistingUser_ShouldReturnNotFound() {
        when(userService.getUserByUid(anyString())).thenReturn(null);

        ResponseEntity<?> response = authController.getUserByUid("non-existing-uid");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNull(response.getBody());

        verify(userService).getUserByUid(anyString());
    }

    @Test
    void logout_ShouldClearCookieAndReturnOk() {

        ResponseEntity<?> response = authController.logout(this.response);

        assertEquals(HttpStatus.OK, response.getStatusCode());

        verify(cookieService).clearAuthCookie(this.response);
    }
}
