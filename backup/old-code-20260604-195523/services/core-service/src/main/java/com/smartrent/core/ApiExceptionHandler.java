package com.smartrent.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.smartrent.core.auth.SupabaseAuthException;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  private final ObjectMapper objectMapper;

  public ApiExceptionHandler(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> validationError(MethodArgumentNotValidException exception) {
    String message = exception.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(error -> error.getField() + ": " + error.getDefaultMessage())
        .orElse("Invalid request.");

    return ResponseEntity.badRequest().body(Map.of("message", message));
  }

  @ExceptionHandler(SupabaseAuthException.class)
  public ResponseEntity<JsonNode> supabaseAuthError(SupabaseAuthException exception) {
    JsonNode body = parseErrorBody(exception.responseBody());
    return ResponseEntity.status(exception.statusCode()).body(body);
  }

  private JsonNode parseErrorBody(String responseBody) {
    try {
      return objectMapper.readTree(responseBody);
    } catch (Exception ignored) {
      ObjectNode fallback = objectMapper.createObjectNode();
      fallback.put("message", "Authentication service error.");
      return fallback;
    }
  }
}
