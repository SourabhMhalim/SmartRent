package com.smartrent.gateway;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class HealthController {
  @GetMapping("/health")
  public Mono<Map<String, String>> health() {
    return Mono.just(Map.of("service", "gateway", "status", "ok"));
  }
}

