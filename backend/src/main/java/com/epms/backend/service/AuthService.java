package com.epms.backend.service;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.dto.AuthUserDto;
import com.epms.backend.dto.LoginRequestDto;
import com.epms.backend.dto.LoginResponseDto;
import com.epms.backend.entity.Role;
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

	@Transactional(readOnly = true)
	public LoginResponseDto login(LoginRequestDto request) {
		String identifier = request.getIdentifier().trim();
		String rawPassword = request.getPassword();

		User user = resolveUser(identifier);
		if (user == null) {
			System.out.println("LOGIN FAILED: User not found with identifier: " + identifier);
			throw new BadCredentialsException("Invalid credentials");
		}
		if (!user.isEnabled()) {
			System.out.println("LOGIN FAILED: User is disabled: " + identifier);
			throw new BadCredentialsException("Invalid credentials");
		}
		if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
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
			return userRepository.findByEmailIgnoreCase(identifier).orElse(null);
		}
		return userRepository.findByEmployeeId(identifier).orElse(null);
	}

	private static AuthUserDto toAuthUserDto(User user) {
		String roleName = user.getRole().getName().trim().toUpperCase().replace(' ', '_');
		return new AuthUserDto(
				user.getId(),
				user.getEmployeeId(),
				user.getEmail(),
				roleName);
	}
}
