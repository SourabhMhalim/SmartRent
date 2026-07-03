package com.smartrent.api.profile;

import java.util.UUID;

import com.smartrent.api.profile.ProfileModels.ProfileRequest;
import com.smartrent.api.profile.ProfileModels.ProfileResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping
    public ProfileResponse getProfile(@AuthenticationPrincipal Jwt jwt) {
        return service.getProfile(profileId(jwt));
    }

    @PutMapping
    public ProfileResponse updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ProfileRequest request
    ) {
        return service.updateProfile(profileId(jwt), request);
    }

    private UUID profileId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
