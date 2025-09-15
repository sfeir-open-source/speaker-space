package com.speakerspace.exception;

public record AppError(String error, String message, Object details) {
    public AppError(String error, String message) {
        this(error, message, null);
    }
}
