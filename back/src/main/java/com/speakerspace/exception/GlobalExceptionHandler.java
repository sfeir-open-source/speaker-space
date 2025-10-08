package com.speakerspace.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.nio.file.AccessDeniedException;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<AppError> handleNullPointerException(NullPointerException ex) {
        log.error("Null pointer exception: {}", ex.getMessage(), ex);
        AppError errorResponse = new AppError(
                "Data validation error",
                "Required data is missing or invalid"
        );
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AppError> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("Illegal argument/validation error: {}", ex.getMessage(), ex);
        return ResponseEntity.badRequest()
                .body(new AppError("Invalid input",ex.getMessage()));
    }

    @ExceptionHandler(UnsupportedOperationException.class)
    public ResponseEntity<AppError> handleUnsupportedOperation(UnsupportedOperationException ex) {
        log.error("Unsupported operation error: {}", ex.getMessage(), ex);
        AppError errorResponse = new AppError(
                "Operation not supported",
                "An internal error occurred while processing your request"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<AppError> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        AppError errorResponse = new AppError(
                "Access denied",
                "You do not have permission to perform this action."
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<AppError> handleEntityNotFound(EntityNotFoundException ex) {
        log.warn("Entity not found: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(new AppError("Resource not found",ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<AppError> handleValidationException(ValidationException ex) {
        log.error("Validation error: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(new AppError("Validation failed",ex.getMessage(),ex.getErrors()));
    }

    @ExceptionHandler(FirebaseAuthenticationException.class)
    public ResponseEntity<AppError> handleFirebaseAuth(FirebaseAuthenticationException ex) {
        log.error("Firebase authentication error: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(new AppError("Authentication failed",ex.getMessage()));
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<AppError> handleTokenExpired(TokenExpiredException ex) {
        log.warn("Token expired: {}", ex.getMessage());
        AppError errorResponse = new AppError(
                "Token expired",
                "Please refresh your authentication"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<AppError> handleJsonParseError(HttpMessageNotReadableException ex) {
        log.error("JSON parsing error: {}", ex.getMessage());
        AppError errorResponse = new AppError(
                "Invalid JSON format",
                "Please check your JSON structure"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<AppError> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime error: {}", ex.getMessage(), ex);
        AppError errorResponse = new AppError(
                "Server error",
                "An error occurred while processing your request"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<AppError> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        AppError errorResponse = new AppError(
                "Server error",
                "Please try again later"
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }
}
