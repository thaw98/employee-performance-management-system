package com.epms.backend.service;

import java.security.SecureRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
	private static final Logger log = LoggerFactory.getLogger(EmployeeAccountService.class);
	private static final String ALLOWED = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";
	private static final SecureRandom RANDOM = new SecureRandom();

	private final EmployeeRepository employeeRepository;
	private final UserRepository userRepository;
	private final RoleRepository roleRepository;
	private final PasswordEncoder passwordEncoder;
	private final MailService mailService;

	@Transactional
	public CreateEmployeeAccountResponseDto createEmployeeAccount(CreateEmployeeAccountRequestDto request) {
		Employee employee = employeeRepository.findById(request.getEmployeePkId())
				.orElseThrow(() -> new IllegalArgumentException("Employee not found"));

		String recordStatus = employee.getRecordStatus() == null ? "" : employee.getRecordStatus().trim();
		if (!"COMPLETED".equalsIgnoreCase(recordStatus)) {
			throw new IllegalArgumentException("Employee information must be completed before account creation");
		}
		if (userRepository.existsByEmployee_Id(employee.getId())) {
			throw new IllegalArgumentException("User account already exists for this employee");
		}
		String email = request.getEmail().trim().toLowerCase();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new IllegalArgumentException("Email already exists in users");
		}

		Role employeeRole = roleRepository.findById(4L)
				.orElseThrow(() -> new IllegalStateException("Role id 4 (Employee) is missing"));
		String temporaryPassword = generateTemporaryPassword(8);

		User user = new User();
		user.setEmployee(employee);
		user.setEmail(email);
		user.setPassword(passwordEncoder.encode(temporaryPassword));
		user.setRole(employeeRole);
		user.setActive(true);
		user.setMustChangePassword(true);
		if (request.getProfilePictureBase64() != null && !request.getProfilePictureBase64().isBlank()) {
			String pic = request.getProfilePictureBase64();
			employee.setProfilePictureBase64(pic);
			employeeRepository.save(employee);
		}

		User saved = userRepository.save(user);
		boolean emailSent = true;
		try {
			mailService.sendTemporaryPasswordEmail(
					saved.getEmail(),
					employee.getEmployeeName(),
					temporaryPassword);
		} catch (RuntimeException ex) {
			emailSent = false;
			log.error("Employee user {} created but temporary password email failed: {}", saved.getEmail(), ex.getMessage());
		}
		String businessEmployeeId = trimToNull(employee.getEmployeeId());
		return new CreateEmployeeAccountResponseDto(
				saved.getId(),
				businessEmployeeId,
				saved.getEmail(),
				saved.getRole().getId(),
				saved.isMustChangePassword(),
				saved.isActive(),
				emailSent);
	}

	@Transactional
	public UserAccountStatusDto updateUserAccountStatus(Long userId, boolean active) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		user.setActive(active);
		User saved = userRepository.save(user);
		var emp = saved.getEmployee();
		String empIdStr = trimToNull(emp.getEmployeeId());
		return new UserAccountStatusDto(
				saved.getId(),
				empIdStr,
				saved.getEmail(),
				saved.isActive());
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String t = value.trim();
		return t.isEmpty() ? null : t;
	}

	private String generateTemporaryPassword(int length) {
		StringBuilder builder = new StringBuilder(length);
		for (int i = 0; i < length; i++) {
			builder.append(ALLOWED.charAt(RANDOM.nextInt(ALLOWED.length())));
		}
		return builder.toString();
	}
}
