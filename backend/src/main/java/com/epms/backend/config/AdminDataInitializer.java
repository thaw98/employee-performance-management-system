package com.epms.backend.config;

import org.springframework.boot.CommandLineRunner;
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
@RequiredArgsConstructor
public class AdminDataInitializer implements CommandLineRunner {

	private final UserRepository userRepository;
	private final EmployeeRepository employeeRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;

	private static final String DEFAULT_PASSWORD = "12345678";

	@Override
	public void run(String... args) {
		createOrUpdateAdmin("1", "admin@gmail.com", "System HR");
		// Keep legacy/demo login working for teams that still use hr@gmail.com.
		createOrUpdateAdmin("HR001", "hr@gmail.com", "HR Manager");
	}

	private void createOrUpdateAdmin(String employeeId, String email, String name) {
		Employee employee = employeeRepository.findByEmployeeId(employeeId).orElseGet(() -> {
			Employee e = new Employee();
			e.setEmployeeId(employeeId);
			e.setEmployeeName(name);
			e.setEmailAddress(email);
			e.setRecordStatus("COMPLETED");
			return employeeRepository.save(e);
		});

		User admin = userRepository.findByEmailIgnoreCase(email)
				.or(() -> userRepository.findByEmployee_EmployeeId(employeeId))
				.orElseGet(User::new);
		admin.setEmployee(employee);
		admin.setEmail(email);
		admin.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
		admin.setRole(roleRepository.findById(1L)
				.orElseThrow(() -> new IllegalStateException("Role id 1 (HR) is missing")));
		admin.setActive(true);
		admin.setMustChangePassword(false);
		userRepository.save(admin);
	}
}
