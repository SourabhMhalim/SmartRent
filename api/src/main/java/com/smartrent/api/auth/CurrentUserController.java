package com.smartrent.api.auth;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class CurrentUserController {

    private final AuthorizationService authorizationService;

    public CurrentUserController(AuthorizationService authorizationService) {
        this.authorizationService = authorizationService;
    }

    @GetMapping
    public CurrentUserResponse currentUser(@AuthenticationPrincipal Jwt jwt) {
        AuthorizationService.CurrentUser user = authorizationService.currentUser(jwt);
        return new CurrentUserResponse(
                user.id().toString(),
                jwt.getClaimAsString("email") == null ? "" : jwt.getClaimAsString("email"),
                user.fullName(),
                user.phone(),
                user.role().name()
        );
    }

    public record CurrentUserResponse(
            String id,
            String email,
            String fullName,
            String phone,
            String role
    ) {
    }
}
