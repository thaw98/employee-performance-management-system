package com.epms.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.AuthUserDto;
import com.epms.backend.dto.LoginRequestDto;
import com.epms.backend.dto.LoginResponseDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;

	@PostMapping("/login")
	public ResponseEntity<ApiResponse<LoginResponseDto>> login(@Valid @RequestBody LoginRequestDto request) {
		try {
			LoginResponseDto data = authService.login(request);
			return ResponseEntity.ok(ApiResponse.ok("Login successful", data));
		} catch (BadCredentialsException ex) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ApiResponse.fail("Invalid credentials"));
		}
	}

	@GetMapping("/me")
	public ResponseEntity<ApiResponse<AuthUserDto>> me(@AuthenticationPrincipal UserPrincipal principal) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ApiResponse.fail("Invalid credentials"));
		}
		AuthUserDto user = new AuthUserDto(
				principal.getId(),
				principal.getEmployeeId(),
				principal.getEmail(),
				principal.getRoleName());
		return ResponseEntity.ok(ApiResponse.ok("OK", user));
	}
}
