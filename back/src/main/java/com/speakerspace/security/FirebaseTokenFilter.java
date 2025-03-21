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
import org.springframework.util.StringUtils;
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

        if (path.contains("/auth/login") || path.contains("/auth/logout") || path.contains("/public/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authorizationHeader = request.getHeader("Authorization");
        String token = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            token = authorizationHeader.substring(7);
        }
        else {
            token = cookieService.getAuthTokenFromCookies(request);
            if (token != null) {
            }
        }

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
            String email = decodedToken.getEmail();
            String uid = decodedToken.getUid();

            List<GrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

            if (email != null && email.equals(adminEmail)) {
                logger.info("Admin role granted to: {}", email);
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            } else {
                logger.info("User email: {}, Admin email from config: {}", email, adminEmail);
            }

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    email, null, authorities);

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            // Toutes les exceptions (y compris RuntimeException) devraient être capturées ici
            // Nettoyage du contexte de sécurité si nécessaire
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}