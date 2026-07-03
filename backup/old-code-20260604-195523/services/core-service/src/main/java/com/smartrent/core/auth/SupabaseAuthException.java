package com.smartrent.core.auth;

import org.springframework.http.HttpStatusCode;

public class SupabaseAuthException extends RuntimeException {
  private final HttpStatusCode statusCode;
  private final String responseBody;

  public SupabaseAuthException(HttpStatusCode statusCode, String responseBody) {
    super(responseBody);
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }

  public HttpStatusCode statusCode() {
    return statusCode;
  }

  public String responseBody() {
    return responseBody;
  }
}

