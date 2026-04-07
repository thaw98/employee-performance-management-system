package com.epms.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.epms.backend.entity.User;
import com.epms.backend.repository.RoleRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@Order(2)
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
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
		admin.setRole(roleRepository.findById(1L)
				.orElseThrow(() -> new IllegalStateException("Role id 1 (HR) is missing")));
		admin.setEnabled(true);
		userRepository.save(admin);
	}
}
