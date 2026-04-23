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
import com.epms.backend.service.UserService;
import com.epms.backend.user.dto.ChangePasswordRequestDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;
	private final UserService userService;

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

	@PostMapping("/change-password")
	public ResponseEntity<ApiResponse<Void>> changePassword(
			@AuthenticationPrincipal UserPrincipal principal,
			@Valid @RequestBody ChangePasswordRequestDto request) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(ApiResponse.fail("Invalid credentials"));
		}
		try {
			userService.changePassword(
					principal.getId(),
					request.getCurrentPassword(),
					request.getNewPassword(),
					request.getConfirmPassword());
			return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
		} catch (RuntimeException e) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
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
				principal.getName(),
				principal.getEmail(),
				principal.getRoleName(),
				principal.getRoleId(),
				principal.isMustChangePassword());
		return ResponseEntity.ok(ApiResponse.ok("OK", user));
	}
}
