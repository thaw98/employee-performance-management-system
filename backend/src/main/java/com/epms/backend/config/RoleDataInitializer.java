package com.epms.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.epms.backend.entity.Role;
import com.epms.backend.repository.RoleRepository;

import lombok.RequiredArgsConstructor;

@Component
@Order(1)
@RequiredArgsConstructor
public class RoleDataInitializer implements CommandLineRunner {

	private final RoleRepository roleRepository;

	@Override
	public void run(String... args) {
		seedRole(1L, "HR");
		seedRole(2L, "Department Head");
		seedRole(3L, "Team Head");
		seedRole(4L, "Employee");
	}

	private void seedRole(Long id, String name) {
		if (roleRepository.existsById(id)) {
			return;
		}
		Role role = new Role();
		role.setId(id);
		role.setName(name);
		roleRepository.save(role);
	}
}
