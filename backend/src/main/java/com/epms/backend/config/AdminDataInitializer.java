package com.epms.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.RoleRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Component
@Order(2)
@ConditionalOnProperty(name = "epms.autoseed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

	private final UserRepository userRepository;
	private final EmployeeRepository employeeRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;

	private static final String DEFAULT_PASSWORD = "12345678";

	@Override
	public void run(String... args) {
		createOrUpdateAdmin("admin@gmail.com", "System HR");
		// Keep legacy/demo login working for teams that still use hr@gmail.com.
		createOrUpdateAdmin("hr@gmail.com", "HR Manager");
	}

	private void createOrUpdateAdmin(String email, String name) {
		User admin = userRepository.findByEmailIgnoreCase(email).orElseGet(User::new);
		Employee employee = admin.getEmployee();
		if (employee == null) {
			employee = new Employee();
			employee.setEmployeeName(name);
			employee.setRecordStatus("COMPLETED");
			employee = employeeRepository.save(employee);
			admin.setEmployee(employee);
		} else {
			employee.setEmployeeName(name);
			employeeRepository.save(employee);
		}
		admin.setEmail(email);
		admin.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
		admin.setRole(roleRepository.findById(1L)
				.orElseThrow(() -> new IllegalStateException("Role id 1 (HR) is missing")));
		admin.setActive(true);
		admin.setMustChangePassword(false);
		userRepository.save(admin);
	}
}
