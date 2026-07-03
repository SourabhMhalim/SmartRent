package com.smartrent.api.common;

import java.util.Map;

import com.smartrent.api.auth.AuthException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<Map<String, Object>> handleAuthException(AuthException exception) {
        return ResponseEntity.status(exception.getStatus()).body(Map.of(
                "message", exception.getMessage(),
                "code", exception.getCode() == null ? "auth_error" : exception.getCode()
        ));
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<Map<String, Object>> handleDomainException(DomainException exception) {
        return ResponseEntity.status(exception.getStatus()).body(Map.of(
                "message", exception.getMessage(),
                "code", exception.getCode()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException exception
    ) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null
                        ? "Invalid value for " + error.getField() + "."
                        : error.getDefaultMessage())
                .orElse("Invalid request.");

        return badRequest(message, "validation_error");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableRequest() {
        return badRequest("Request body must contain valid JSON.", "invalid_json");
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String, Object>> handleMissingHeader(
            MissingRequestHeaderException exception
    ) {
        return badRequest(
                "Required header " + exception.getHeaderName() + " is missing.",
                "missing_header"
        );
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message, String code) {
        return ResponseEntity.badRequest().body(Map.of(
                "message", message,
                "code", code
        ));
    }
}
