package com.epms.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.epms.backend.domain.user.Role;
import com.epms.backend.domain.user.User;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	@Override
	public void run(String... args) {
		if (userRepository.findByEmailIgnoreCase("admin@gmail.com").isPresent()) {
			return;
		}
		User admin = new User();
		admin.setEmployeeId("1");
		admin.setEmail("admin@gmail.com");
		admin.setPasswordHash(passwordEncoder.encode("12345678"));
		admin.setRole(Role.ADMIN);
		admin.setEnabled(true);
		userRepository.save(admin);
	}
}
