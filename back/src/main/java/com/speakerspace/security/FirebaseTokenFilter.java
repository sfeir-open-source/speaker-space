package com.speakerspace.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.speakerspace.config.CookieService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class FirebaseTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseTokenFilter.class);

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

        logger.info("Processing request: {} {}", method, path);

        if ("OPTIONS".equals(method)) {
            response.setStatus(HttpServletResponse.SC_OK);
            filterChain.doFilter(request, response);
            return;
        }

        if (path.contains("/auth/login") || path.contains("/auth/logout") || path.contains("/public/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorizationHeader = request.getHeader("Authorization");
        String token = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7);
            logger.debug("Token found in Authorization header");
        } else {
            token = cookieService.getAuthTokenFromCookies(request);
            if (token != null) {
                logger.debug("Token found in cookies");
            }
        }

        if (token == null || token.trim().isEmpty()) {
            logger.warn("No authentication token found for path: {}", path);
            sendUnauthorizedResponse(response, "Authentication required");
            return;
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String email = decodedToken.getEmail();
            String uid = decodedToken.getUid();

            logger.debug("Token verified successfully for user: {} ({})", email, uid);

            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

            if (email != null && email.equals(adminEmail)) {
                logger.info("Admin role granted to: {}", email);
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    uid, null, authorities);

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            logger.debug("Authentication set for user: {}", uid);

            filterChain.doFilter(request, response);

        } catch (FirebaseAuthException e) {
            logger.error("Firebase token verification failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            sendUnauthorizedResponse(response, "Invalid token: " + e.getErrorCode());
        } catch (ServletException e) {
            logger.error("Servlet exception during request processing: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during token verification: {}", e.getMessage(), e);
            SecurityContextHolder.clearContext();
            sendUnauthorizedResponse(response, "Authentication error");
        }
    }

    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String jsonResponse = String.format("{\"error\":\"%s\",\"status\":401,\"timestamp\":\"%s\"}",
                message,
                java.time.Instant.now().toString());

        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }
}
