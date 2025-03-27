package com.speakerspace.config;

import com.speakerspace.controller.AuthController;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
public class CookieService {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private static final int COOKIE_MAX_AGE = 3600 * 24 * 30;
    private static final boolean SECURE = true;
    private static final boolean HTTP_ONLY = true;
    private static final String COOKIE_PATH = "/";
    private static final String AUTH_COOKIE_NAME = "auth_token";

    public void setAuthCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(AUTH_COOKIE_NAME, token)
                .maxAge(COOKIE_MAX_AGE)
                .httpOnly(HTTP_ONLY)
                .secure(SECURE)
                .path(COOKIE_PATH)
                .sameSite("Lax")
                .build();

        logger.info("Setting auth cookie for user");
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public void clearAuthCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(AUTH_COOKIE_NAME, "")
                .maxAge(0)
                .httpOnly(HTTP_ONLY)
                .secure(SECURE)
                .path(COOKIE_PATH)
                .sameSite("Lax")
                .build();

        logger.info("Clearing auth cookie");
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    public String getAuthTokenFromCookies(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (AUTH_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}