package com.epms.backend.service;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.AuthUserDto;
import com.epms.backend.dto.LoginRequestDto;
import com.epms.backend.dto.LoginResponseDto;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.JwtService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;

	@Transactional
	public LoginResponseDto login(LoginRequestDto request) {
		String identifier = request.getIdentifier().trim();
		String rawPassword = request.getPassword();

		User user = resolveUser(identifier);
		if (user == null) {
			System.out.println("LOGIN FAILED: User not found with identifier: " + identifier);
			throw new BadCredentialsException("Invalid credentials");
		}
		if (!user.isActive()) {
			System.out.println("LOGIN FAILED: User is disabled: " + identifier);
			throw new BadCredentialsException("Invalid credentials");
		}
		if (!isPasswordValid(user, rawPassword)) {
			System.out.println("LOGIN FAILED: Password mismatch for user: " + identifier);
			throw new BadCredentialsException("Invalid credentials");
		}

		String token = jwtService.generateToken(user);
		LoginResponseDto response = new LoginResponseDto();
		response.setToken(token);
		response.setTokenType("Bearer");
		response.setUser(toAuthUserDto(user));
		return response;
	}

	private User resolveUser(String identifier) {
		if (identifier.contains("@")) {
			return userRepository.findByEmployee_EmailIgnoreCase(identifier).orElse(null);
		}
		if (identifier.matches("^[0-9]+$")) {
			try {
				return userRepository.findByEmployee_Id(Long.parseLong(identifier)).orElse(null);
			} catch (NumberFormatException ex) {
				return null;
			}
		}
		return null;
	}

	private boolean isPasswordValid(User user, String rawPassword) {
		String storedPassword = user.getPassword();
		if (storedPassword == null || storedPassword.isBlank()) {
			return false;
		}

		// Normal path: password already stored as a BCrypt hash.
		if (passwordEncoder.matches(rawPassword, storedPassword)) {
			return true;
		}

		// Backward compatibility: allow legacy plaintext and upgrade immediately.
		if (rawPassword.equals(storedPassword)) {
			user.setPassword(passwordEncoder.encode(rawPassword));
			userRepository.save(user);
			return true;
		}

		return false;
	}

	private static AuthUserDto toAuthUserDto(User user) {
		String roleName = user.getRole().getName().trim().toUpperCase().replace(' ', '_');
		var emp = user.getEmployee();
		String employeeIdStr = emp.getEmployeeId();
		if (employeeIdStr == null || employeeIdStr.isBlank()) {
			employeeIdStr = String.valueOf(emp.getId());
		} else {
			employeeIdStr = employeeIdStr.trim();
		}
		return new AuthUserDto(
				user.getId(),
				employeeIdStr,
				user.getEmployee().getEmployeeName(),
				user.getEmail(),
				roleName,
				user.getRole().getId(),
				user.isMustChangePassword());
	}
}
