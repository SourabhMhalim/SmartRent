package com.smartrent.core.auth;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Component
public class SupabaseAuthClient {
  private final RestClient restClient;
  private final String publishableKey;

  public SupabaseAuthClient(
      RestClient.Builder restClientBuilder,
      @Value("${supabase.url}") String supabaseUrl,
      @Value("${supabase.publishable-key}") String publishableKey
  ) {
    this.restClient = restClientBuilder.baseUrl(supabaseUrl).build();
    this.publishableKey = publishableKey;
  }

  public JsonNode signInWithPassword(AuthRequest request) {
    return post("/auth/v1/token?grant_type=password", request);
  }

  public JsonNode signUp(AuthRequest request) {
    return post("/auth/v1/signup", request);
  }

  private JsonNode post(String path, AuthRequest request) {
    try {
      return restClient
          .post()
          .uri(path)
          .header("apikey", publishableKey)
          .header(HttpHeaders.AUTHORIZATION, "Bearer " + publishableKey)
          .contentType(MediaType.APPLICATION_JSON)
          .body(Map.of("email", request.email(), "password", request.password()))
          .retrieve()
          .body(JsonNode.class);
    } catch (RestClientResponseException exception) {
      throw new SupabaseAuthException(
          exception.getStatusCode(),
          exception.getResponseBodyAsString()
      );
    }
  }
}

