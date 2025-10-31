package com.speakerspace.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    @Autowired
    private FirebaseAuth firebaseAuth;

    @Autowired
    private CookieService cookieService;

    @Value("${admin.email}")
    private String adminEmail;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("OPTIONS".equals(method)) {
            response.setStatus(HttpServletResponse.SC_OK);
            filterChain.doFilter(request, response);
            return;
        }

        if (path.contains("/auth/login") ||
                path.contains("/auth/logout") ||
                path.startsWith("/public/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorizationHeader = request.getHeader("Authorization");
        String token = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7);
            log.debug("Token found in Authorization header");
        } else {
            token = cookieService.getAuthTokenFromCookies(request);
            if (token != null) {
                log.debug("Token found in cookies");
            }
        }

        if (token == null || token.trim().isEmpty()) {
            log.warn("No authentication token found for path: {}", path);
            sendUnauthorizedResponse(response, "Authentication required");
            return;
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String email = decodedToken.getEmail();
            String uid = decodedToken.getUid();

            log.debug("Token verified successfully for user: {} ({})", email, uid);

            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

            if (email != null && email.equals(adminEmail)) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    uid, null, authorities);

            Map<String, Object> details = new HashMap<>();
            details.put("email", email);
            details.put("uid", uid);
            authentication.setDetails(details);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug("Authentication set for user: {} ({})", uid, email);

            filterChain.doFilter(request, response);

        } catch (FirebaseAuthException e) {
            log.error("Firebase token verification failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            sendUnauthorizedResponse(response, "Invalid token: " + e.getErrorCode());
        } catch (Exception e) {
            log.error("Unexpected error during token verification: {}", e.getMessage(), e);
            SecurityContextHolder.clearContext();
            sendUnauthorizedResponse(response, "Authentication error");
        }
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        response.addHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.addHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

        String jsonResponse = String.format("{\"error\":\"%s\",\"status\":401,\"timestamp\":\"%s\"}",
                message,
                java.time.Instant.now().toString());

        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }
}
