package com.epms.backend.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Order(6)
@RequiredArgsConstructor
@Slf4j
@Transactional
public class LegacyUserPasswordMigrationInitializer implements CommandLineRunner {

    private static final List<Long> TARGET_USER_IDS = List.of(1L, 6L, 7L, 8L, 9L, 10L, 11L);
    private static final String DEFAULT_PASSWORD = "12345678";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        List<User> users = userRepository.findAllById(TARGET_USER_IDS);
        int updatedCount = 0;

        for (User user : users) {
            String currentPassword = user.getPassword();
            if (isBcryptHash(currentPassword)) {
                continue;
            }

            user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
            updatedCount++;
        }

        if (updatedCount > 0) {
            userRepository.saveAll(users);
            log.info("Migrated {} legacy user password(s) to BCrypt for IDs {}", updatedCount, TARGET_USER_IDS);
        }
    }

    private boolean isBcryptHash(String value) {
        return value != null && value.startsWith("$2");
    }
}
