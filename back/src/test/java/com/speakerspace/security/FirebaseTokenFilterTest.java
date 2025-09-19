package com.speakerspace.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class FirebaseTokenFilterTest {

    @Mock
    private FirebaseAuth firebaseAuth;

    @Mock
    private CookieService cookieService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private FirebaseToken firebaseToken;

    @InjectMocks
    private FirebaseTokenFilter firebaseTokenFilter;

    private static final String VALID_TOKEN = "valid-token";
    private static final String INVALID_TOKEN = "invalid-token";
    private static final String USER_EMAIL = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final String USER_UID = "test-uid-123";

    @BeforeEach
    void setUp() throws Exception {
        SecurityContextHolder.clearContext();

        ReflectionTestUtils.setField(firebaseTokenFilter, "adminEmail", ADMIN_EMAIL);

        when(firebaseAuth.verifyIdToken(VALID_TOKEN)).thenReturn(firebaseToken);
        when(firebaseToken.getEmail()).thenReturn(USER_EMAIL);
        when(firebaseToken.getUid()).thenReturn(USER_UID);

        when(firebaseAuth.verifyIdToken(INVALID_TOKEN)).thenThrow(
                new RuntimeException("Invalid token"));
    }


    @Test
    void doFilterInternal_WithAuthEndpoint_ShouldSkipAuthentication() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/auth/login");

        firebaseTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(firebaseAuth);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_WithPublicEndpoint_ShouldSkipAuthentication() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/public/resources");

        firebaseTokenFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(firebaseAuth);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void doFilterInternal_WithValidHeaderToken_ShouldAuthenticate() throws ServletException, IOException, FirebaseAuthException {
        when(request.getRequestURI()).thenReturn("/api/protected");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + VALID_TOKEN);

        firebaseTokenFilter.doFilterInternal(request, response, filterChain);

        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(USER_EMAIL, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_USER")));
        assertFalse(SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void doFilterInternal_WithValidCookieToken_ShouldAuthenticate() throws ServletException, IOException, FirebaseAuthException {
        when(request.getRequestURI()).thenReturn("/api/protected");
        when(request.getHeader("Authorization")).thenReturn(null);
        when(cookieService.getAuthTokenFromCookies(request)).thenReturn(VALID_TOKEN);

        firebaseTokenFilter.doFilterInternal(request, response, filterChain);

        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(USER_EMAIL, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
    }

    @Test
    void doFilterInternal_WithAdminUser_ShouldGrantAdminRole() throws ServletException, IOException, FirebaseAuthException {
        when(request.getRequestURI()).thenReturn("/api/protected");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + VALID_TOKEN);
        when(firebaseToken.getEmail()).thenReturn(ADMIN_EMAIL);

        firebaseTokenFilter.doFilterInternal(request, response, filterChain);

        verify(firebaseAuth).verifyIdToken(VALID_TOKEN);
        verify(filterChain).doFilter(request, response);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals(ADMIN_EMAIL, SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        assertTrue(SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));
    }

    @Test
    void doFilterInternal_WithInvalidToken_ShouldClearSecurityContext() throws ServletException, IOException, FirebaseAuthException {
        when(request.getRequestURI()).thenReturn("/api/protected");
        when(request.getHeader("Authorization")).thenReturn("Bearer " + INVALID_TOKEN);

        doAnswer(invocation -> {
            SecurityContextHolder.clearContext();
            throw new RuntimeException("Invalid token");
        }).when(firebaseAuth).verifyIdToken(INVALID_TOKEN);

        firebaseTokenFilter.doFilterInternal(request, response, filterChain);

        verify(firebaseAuth).verifyIdToken(INVALID_TOKEN);
        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }


    @Test
    void doFilterInternal_WithNoToken_ShouldContinueFilterChain() throws ServletException, IOException, FirebaseAuthException {
        when(request.getRequestURI()).thenReturn("/api/protected");
        when(request.getHeader("Authorization")).thenReturn(null);
        when(cookieService.getAuthTokenFromCookies(request)).thenReturn(null);

        firebaseTokenFilter.doFilterInternal(request, response, filterChain);

        verify(firebaseAuth, never()).verifyIdToken(anyString());
        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}