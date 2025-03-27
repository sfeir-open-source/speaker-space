package com.speakerspace.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.IOException;
import java.io.PrintWriter;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class FirebaseAuthenticationFilterTest {

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private FirebaseToken firebaseToken;

    @Mock
    private PrintWriter printWriter;

    @InjectMocks
    private FirebaseAuthenticationFilter firebaseAuthenticationFilter;

    private static final String VALID_TOKEN = "valid-token";
    private static final String INVALID_TOKEN = "invalid-token";
    private static final String USER_UID = "test-uid-123";

    @BeforeEach
    void setUp() throws Exception {
        // Configuration pour un token valide
        when(firebaseAuth.verifyIdToken(VALID_TOKEN)).thenReturn(firebaseToken);
        when(firebaseToken.getUid()).thenReturn(USER_UID);

        // Configuration pour un token invalide
        when(firebaseAuth.verifyIdToken(INVALID_TOKEN)).thenThrow(new IllegalArgumentException("Invalid token"));

        // Configuration de la réponse
        when(response.getWriter()).thenReturn(printWriter);
    }

    @Test
    void doFilterInternal_WithValidToken_ShouldContinueFilterChain() throws ServletException, IOException, FirebaseAuthException {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer " + VALID_TOKEN);

        // When
        firebaseAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(printWriter); // Aucune écriture dans la réponse
    }

    @Test
    void doFilterInternal_WithInvalidToken_ShouldReturnUnauthorized() throws ServletException, IOException, FirebaseAuthException {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Bearer " + INVALID_TOKEN);

        // When
        firebaseAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(firebaseAuth).verifyIdToken(INVALID_TOKEN);
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(printWriter).write("Invalid token");
        verify(filterChain, never()).doFilter(request, response); // Le filtre ne continue pas
    }

    @Test
    void doFilterInternal_WithNoToken_ShouldContinueFilterChain() throws ServletException, IOException, FirebaseAuthException {
        // Given
        when(request.getHeader("Authorization")).thenReturn(null);

        // When
        firebaseAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(firebaseAuth, never()).verifyIdToken(anyString());
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(printWriter); // Aucune écriture dans la réponse
    }

    @Test
    void doFilterInternal_WithNonBearerToken_ShouldContinueFilterChain() throws ServletException, IOException, FirebaseAuthException {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNzd29yZA==");

        // When
        firebaseAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(firebaseAuth, never()).verifyIdToken(anyString());
        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(printWriter); // Aucune écriture dans la réponse
    }
}
