package com.smartrent.api.notification;

import java.util.UUID;

import com.smartrent.api.notification.NotificationModels.NotificationResponse;
import com.smartrent.api.notification.NotificationModels.NotificationSummaryResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public NotificationSummaryResponse listNotifications(@AuthenticationPrincipal Jwt jwt) {
        return service.listNotifications(userId(jwt));
    }

    @PostMapping("/{notificationId}/read")
    public NotificationResponse markRead(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID notificationId
    ) {
        return service.markRead(userId(jwt), notificationId);
    }

    @PostMapping("/read-all")
    public NotificationSummaryResponse markAllRead(@AuthenticationPrincipal Jwt jwt) {
        return service.markAllRead(userId(jwt));
    }

    private UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
