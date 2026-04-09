package com.epms.backend.service;

import java.security.SecureRandom;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.user.CreateEmployeeAccountRequestDto;
import com.epms.backend.dto.user.CreateEmployeeAccountResponseDto;
import com.epms.backend.dto.user.UserAccountStatusDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.RoleRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeAccountService {
	private static final String ALLOWED = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
	private static final SecureRandom RANDOM = new SecureRandom();

	private final EmployeeRepository employeeRepository;
	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;

	@Transactional
	public CreateEmployeeAccountResponseDto createEmployeeAccount(CreateEmployeeAccountRequestDto request) {
		Employee employee = employeeRepository.findById(request.getEmployeePkId())
				.orElseThrow(() -> new IllegalArgumentException("Employee not found"));

		if (!"COMPLETED".equalsIgnoreCase(employee.getRecordStatus())) {
			throw new IllegalArgumentException("Employee information must be completed before account creation");
		}
		if (userRepository.existsByEmployee_Id(employee.getId())) {
			throw new IllegalArgumentException("User account already exists for this employee");
		}
		if (userRepository.existsByEmailIgnoreCase(employee.getEmailAddress())) {
			throw new IllegalArgumentException("Email already exists in users");
		}

		Role employeeRole = roleRepository.findById(4L)
				.orElseThrow(() -> new IllegalStateException("Role id 4 (Employee) is missing"));
		String temporaryPassword = generateTemporaryPassword(12);

		User user = new User();
		user.setEmployee(employee);
		user.setEmail(employee.getEmailAddress());
		user.setPassword(passwordEncoder.encode(temporaryPassword));
		user.setRole(employeeRole);
		user.setActive(true);
		user.setMustChangePassword(true);

		User saved = userRepository.save(user);
		return new CreateEmployeeAccountResponseDto(
				saved.getId(),
				employee.getEmployeeId(),
				saved.getEmail(),
				saved.getRole().getId(),
				saved.isMustChangePassword(),
				saved.isActive(),
				temporaryPassword);
	}

	@Transactional
	public UserAccountStatusDto updateUserAccountStatus(Long userId, boolean active) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		user.setActive(active);
		User saved = userRepository.save(user);
		return new UserAccountStatusDto(
				saved.getId(),
				saved.getEmployee().getEmployeeId(),
				saved.getEmail(),
				saved.isActive());
	}

	private String generateTemporaryPassword(int length) {
		StringBuilder builder = new StringBuilder(length);
		for (int i = 0; i < length; i++) {
			builder.append(ALLOWED.charAt(RANDOM.nextInt(ALLOWED.length())));
		}
		return builder.toString();
	}
}
