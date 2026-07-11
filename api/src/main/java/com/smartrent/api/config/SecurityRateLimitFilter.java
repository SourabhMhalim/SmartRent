package com.smartrent.api.config;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SecurityRateLimitFilter extends OncePerRequestFilter {

    private static final Duration WINDOW = Duration.ofMinutes(1);
    private static final int AUTH_LIMIT = 10;
    private static final int PAYMENT_LIMIT = 30;

    private final Clock clock;
    private final Map<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public SecurityRateLimitFilter() {
        this(Clock.systemUTC());
    }

    SecurityRateLimitFilter(Clock clock) {
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Limit limit = limitFor(request);
        if (limit != null && exceeded(request, limit)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(WINDOW.toSeconds()));
            response.setContentType("application/json");
            response.getWriter().write("""
                    {"message":"Too many attempts. Please wait a minute and try again.","code":"rate_limited"}
                    """);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private Limit limitFor(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return null;
        }

        String path = request.getRequestURI();
        if (path.startsWith("/api/auth/")) {
            return new Limit("auth", AUTH_LIMIT);
        }
        if (path.matches("^/api/(tenant-portal/)?invoices/[^/]+/(payment-submission|verify-payment|approve-payment|reject-payment)$")) {
            return new Limit("payment", PAYMENT_LIMIT);
        }
        return null;
    }

    private boolean exceeded(HttpServletRequest request, Limit limit) {
        String key = limit.name() + ":" + clientIp(request);
        Instant now = Instant.now(clock);
        Instant oldestAllowed = now.minus(WINDOW);
        Deque<Instant> bucket = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());

        synchronized (bucket) {
            while (!bucket.isEmpty() && bucket.peekFirst().isBefore(oldestAllowed)) {
                bucket.removeFirst();
            }
            if (bucket.size() >= limit.maxAttempts()) {
                return true;
            }
            bucket.addLast(now);
            return false;
        }
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private record Limit(String name, int maxAttempts) {
    }
}
