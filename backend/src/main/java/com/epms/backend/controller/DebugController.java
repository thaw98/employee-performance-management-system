package com.epms.backend.controller;

import com.epms.backend.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {
    private final com.epms.backend.repository.UserRepository userRepository;
    public DebugController(com.epms.backend.repository.UserRepository userRepository) { this.userRepository = userRepository; }

    @GetMapping("/auth-check")
    public Map<String, Object> checkAuth(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> map = new HashMap<>();
        map.put("total_users", userRepository.count());
        if (principal == null) {
            map.put("authenticated", false);
        } else {
            map.put("authenticated", true);
            map.put("id", principal.getId());
            map.put("email", principal.getEmail());
            map.put("authorities", principal.getAuthorities());
        }
        return map;
    }
}
