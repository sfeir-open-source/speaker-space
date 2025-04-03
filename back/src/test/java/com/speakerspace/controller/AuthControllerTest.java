package com.speakerspace.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import com.speakerspace.config.FirebaseTokenRequest;
import com.speakerspace.dto.UserDTO;
import com.speakerspace.mapper.UserMapper;
import com.speakerspace.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletRequest;
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
    private UserMapper userMapper;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpServletRequest request;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private AuthController authController;

    private UserDTO testUserDTO;
    private FirebaseTokenRequest tokenRequest;
    private final String VALID_TOKEN = "valid-token-123";
    private final String TEST_UID = "test-uid-123";

    @BeforeEach
    void setUp() {
        testUserDTO = new UserDTO();
        testUserDTO.setUid(TEST_UID);
        testUserDTO.setDisplayName("Test User");
        testUserDTO.setEmail("test@example.com");
        testUserDTO.setPhotoURL("https://example.com/photo.jpg");

        tokenRequest = new FirebaseTokenRequest();
        tokenRequest.idToken = VALID_TOKEN;

        when(firebaseToken.getUid()).thenReturn(testUserDTO.getUid());
        when(firebaseToken.getEmail()).thenReturn(testUserDTO.getEmail());
        when(firebaseToken.getName()).thenReturn(testUserDTO.getDisplayName());
        when(firebaseToken.getPicture()).thenReturn(testUserDTO.getPhotoURL());
    }

    @Test
    void login_WithValidTokenAndExistingUser_ShouldReturnUser() throws Exception {
        // Given
        when(firebaseAuth.verifyIdToken(VALID_TOKEN)).thenReturn(firebaseToken);
        when(userService.getUserByUid(TEST_UID)).thenReturn(testUserDTO);

        // When
        ResponseEntity<?> responseEntity = authController.login(tokenRequest, response);

        // Then
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(testUserDTO, responseEntity.getBody());
        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(cookieService).setAuthCookie(response, VALID_TOKEN);
        verify(userService).getUserByUid(TEST_UID);
        verify(userService, never()).saveUser(any(UserDTO.class));
    }

    @Test
    void login_WithValidTokenAndNewUser_ShouldCreateAndReturnUser() throws Exception {
        // Given
        when(firebaseAuth.verifyIdToken(VALID_TOKEN)).thenReturn(firebaseToken);
        when(userService.getUserByUid(TEST_UID)).thenReturn(null);
        when(userService.saveUser(any(UserDTO.class))).thenReturn(testUserDTO);

        // When
        ResponseEntity<?> responseEntity = authController.login(tokenRequest, response);

        // Then
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(testUserDTO, responseEntity.getBody());
        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(cookieService).setAuthCookie(response, VALID_TOKEN);
        verify(userService).getUserByUid(TEST_UID);
        verify(userService).saveUser(any(UserDTO.class));
    }

    @Test
    void login_WithInvalidToken_ShouldReturnUnauthorized() throws Exception {
        // Given
        when(firebaseAuth.verifyIdToken(VALID_TOKEN))
                .thenThrow(new IllegalArgumentException("Invalid token"));

        // When
        ResponseEntity<?> responseEntity = authController.login(tokenRequest, response);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, responseEntity.getStatusCode());
        assertEquals("Invalid token", responseEntity.getBody());
        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(cookieService, never()).setAuthCookie(any(), anyString());
        verify(userService, never()).getUserByUid(anyString());
        verify(userService, never()).saveUser(any(UserDTO.class));
    }

    @Test
    void login_WithNoToken_ShouldReturnBadRequest() {
        // Given
        FirebaseTokenRequest emptyRequest = new FirebaseTokenRequest();
        emptyRequest.idToken = null;

        // When
        ResponseEntity<?> responseEntity = authController.login(emptyRequest, response);

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, responseEntity.getStatusCode());
        assertEquals("No token provided", responseEntity.getBody());
        verifyNoInteractions(firebaseAuth);
        verifyNoInteractions(userService);
        verifyNoInteractions(cookieService);
    }

    @Test
    void createUser_ShouldSaveAndReturnUser() {
        // Given
        when(userService.saveUser(testUserDTO)).thenReturn(testUserDTO);

        // When
        ResponseEntity<?> responseEntity = authController.createUser(testUserDTO);

        // Then
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(testUserDTO, responseEntity.getBody());
        verify(userService).saveUser(testUserDTO);
    }

    @Test
    void getUserByUid_ExistingUser_ShouldReturnUser() {
        // Given
        when(userService.getUserByUid(TEST_UID)).thenReturn(testUserDTO);

        // When
        ResponseEntity<?> responseEntity = authController.getUserByUid(TEST_UID);

        // Then
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(testUserDTO, responseEntity.getBody());
        verify(userService).getUserByUid(TEST_UID);
    }

    @Test
    void getUserByUid_NonExistingUser_ShouldReturnNotFound() {
        // Given
        String nonExistingUid = "non-existing-uid";
        when(userService.getUserByUid(nonExistingUid)).thenReturn(null);

        // When
        ResponseEntity<?> responseEntity = authController.getUserByUid(nonExistingUid);

        // Then
        assertEquals(HttpStatus.NOT_FOUND, responseEntity.getStatusCode());
        assertNull(responseEntity.getBody());
        verify(userService).getUserByUid(nonExistingUid);
    }

    @Test
    void updateUserProfile_WithValidTokenAndAuthorizedUser_ShouldUpdateAndReturnUser() throws Exception {
        // Given
        when(cookieService.getAuthTokenFromCookies(request)).thenReturn(VALID_TOKEN);
        when(firebaseAuth.verifyIdToken(VALID_TOKEN)).thenReturn(firebaseToken);
        when(userService.updateUser(testUserDTO)).thenReturn(testUserDTO);

        // When
        ResponseEntity<?> responseEntity = authController.updateUserProfile(testUserDTO, request);

        // Then
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(testUserDTO, responseEntity.getBody());
        verify(cookieService).getAuthTokenFromCookies(request);
        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(userService).updateUser(testUserDTO);
    }

    @Test
    void getUserData_WithValidTokenAndAuthorizedUser_ShouldReturnUser() throws Exception {
        // Given
        when(cookieService.getAuthTokenFromCookies(request)).thenReturn(VALID_TOKEN);
        when(firebaseAuth.verifyIdToken(VALID_TOKEN)).thenReturn(firebaseToken);
        when(userService.getUserByUid(TEST_UID)).thenReturn(testUserDTO);

        // When
        ResponseEntity<?> responseEntity = authController.getUserData(TEST_UID, request);

        // Then
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        assertEquals(testUserDTO, responseEntity.getBody());
        verify(cookieService).getAuthTokenFromCookies(request);
        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(userService).getUserByUid(TEST_UID);
    }

    @Test
    void logout_ShouldClearCookieAndReturnOk() {
        // Given

        // When
        ResponseEntity<?> responseEntity = authController.logout(response);

        // Then
        assertEquals(HttpStatus.OK, responseEntity.getStatusCode());
        verify(cookieService).clearAuthCookie(response);
    }
}