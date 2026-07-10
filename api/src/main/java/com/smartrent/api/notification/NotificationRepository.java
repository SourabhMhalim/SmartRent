package com.smartrent.api.notification;

import static com.smartrent.api.notification.NotificationModels.NotificationType;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.smartrent.api.notification.NotificationModels.NotificationResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationRepository {

    private final JdbcTemplate jdbcTemplate;

    public NotificationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void createNotification(
            UUID recipientUserId,
            NotificationType notificationType,
            String title,
            String message,
            String actionHref,
            UUID relatedInvoiceId,
            UUID relatedTenantId
    ) {
        jdbcTemplate.update("""
                insert into notifications (
                    recipient_user_id, notification_type, title, message,
                    action_href, related_invoice_id, related_tenant_id
                ) values (?, ?, ?, ?, ?, ?, ?)
                """, recipientUserId, notificationType.name(), title, message,
                actionHref, relatedInvoiceId, relatedTenantId);
    }

    public Optional<UUID> findTenantUserId(UUID tenantId) {
        return jdbcTemplate.query("""
                        select tenant_user_id
                        from tenants
                        where id = ?
                          and tenant_user_id is not null
                          and archived_at is null
                        """,
                (resultSet, rowNumber) -> resultSet.getObject("tenant_user_id", UUID.class),
                tenantId
        ).stream().findFirst();
    }

    public List<NotificationResponse> findNotifications(UUID recipientUserId, int limit) {
        return jdbcTemplate.query("""
                select id, notification_type, title, message, action_href,
                       related_invoice_id, related_tenant_id, read_at, created_at
                from notifications
                where recipient_user_id = ?
                order by created_at desc
                limit ?
                """, NOTIFICATION_MAPPER, recipientUserId, limit);
    }

    public Optional<NotificationResponse> findNotification(
            UUID recipientUserId,
            UUID notificationId
    ) {
        return jdbcTemplate.query("""
                select id, notification_type, title, message, action_href,
                       related_invoice_id, related_tenant_id, read_at, created_at
                from notifications
                where recipient_user_id = ? and id = ?
                """, NOTIFICATION_MAPPER, recipientUserId, notificationId)
                .stream()
                .findFirst();
    }

    public int unreadCount(UUID recipientUserId) {
        Integer count = jdbcTemplate.queryForObject("""
                select count(*)
                from notifications
                where recipient_user_id = ? and read_at is null
                """, Integer.class, recipientUserId);
        return count == null ? 0 : count;
    }

    public int markRead(UUID recipientUserId, UUID notificationId) {
        return jdbcTemplate.update("""
                update notifications
                set read_at = coalesce(read_at, now())
                where recipient_user_id = ? and id = ?
                """, recipientUserId, notificationId);
    }

    public int markAllRead(UUID recipientUserId) {
        return jdbcTemplate.update("""
                update notifications
                set read_at = now()
                where recipient_user_id = ? and read_at is null
                """, recipientUserId);
    }

    private static final RowMapper<NotificationResponse> NOTIFICATION_MAPPER =
            (resultSet, rowNumber) -> new NotificationResponse(
                    resultSet.getObject("id", UUID.class),
                    NotificationType.valueOf(resultSet.getString("notification_type")),
                    resultSet.getString("title"),
                    resultSet.getString("message"),
                    resultSet.getString("action_href"),
                    resultSet.getObject("related_invoice_id", UUID.class),
                    resultSet.getObject("related_tenant_id", UUID.class),
                    instant(resultSet, "read_at"),
                    instant(resultSet, "created_at")
            );

    private static Instant instant(ResultSet resultSet, String column) throws SQLException {
        var value = resultSet.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }
}
