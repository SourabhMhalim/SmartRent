package com.smartrent.core.auth;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {
  private final SupabaseAuthClient authClient;

  public AuthController(SupabaseAuthClient authClient) {
    this.authClient = authClient;
  }

  @PostMapping("/login")
  public JsonNode login(@Valid @RequestBody AuthRequest request) {
    return authClient.signInWithPassword(request);
  }

  @PostMapping("/signup")
  public JsonNode signup(@Valid @RequestBody AuthRequest request) {
    return authClient.signUp(request);
  }
}

