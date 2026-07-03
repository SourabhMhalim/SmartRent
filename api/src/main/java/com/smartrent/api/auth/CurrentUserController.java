package com.smartrent.api.auth;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class CurrentUserController {

    @GetMapping
    public Map<String, Object> currentUser(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
                "id", jwt.getSubject(),
                "email", jwt.getClaimAsString("email") == null
                        ? ""
                        : jwt.getClaimAsString("email"),
                "role", jwt.getClaimAsString("role") == null
                        ? ""
                        : jwt.getClaimAsString("role")
        );
    }
}
