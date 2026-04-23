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
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public LoginResponseDto login(LoginRequestDto request) {
        String email = request.getEmail().trim().toLowerCase();
        String rawPassword = request.getPassword();

        log.info("Login attempt for email: {}", email);

        User user = userRepository.findByEmployee_EmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isActive()) {
            log.warn("User is inactive: {}", email);
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!isPasswordValid(user, rawPassword)) {
            log.warn("Invalid password for user: {}", email);
            throw new BadCredentialsException("Invalid credentials");
        }

        String token = jwtService.generateToken(user);
        log.info("Login successful for user: {}", email);

        LoginResponseDto response = new LoginResponseDto();
        response.setToken(token);
        response.setTokenType("Bearer");
        response.setUser(toAuthUserDto(user));
        return response;
    }

    private boolean isPasswordValid(User user, String rawPassword) {
        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        // Try BCrypt match first
        if (passwordEncoder.matches(rawPassword, storedPassword)) {
            return true;
        }

        // Fallback: Allow plain text password and upgrade to BCrypt
        if (rawPassword.equals(storedPassword)) {
            String encodedPassword = passwordEncoder.encode(rawPassword);
            user.setPassword(encodedPassword);
            userRepository.save(user);
            log.info("Upgraded plain text password to BCrypt for user: {}", user.getEmail());
            return true;
        }

        return false;
    }

    private AuthUserDto toAuthUserDto(User user) {
        var emp = user.getEmployee();
        String roleName = user.getRole().getName();
        String employeeIdStr = emp.getEmployeeId();
        
        if (employeeIdStr == null || employeeIdStr.isBlank()) {
            employeeIdStr = String.valueOf(emp.getId());
        }
        
        return AuthUserDto.builder()
                .id(user.getId())
                .employeeId(employeeIdStr)
                .name(emp.getEmployeeName())
                .email(emp.getEmail())
                .role(roleName)
                .roleId(user.getRole().getId())
                .mustChangePassword(user.isMustChangePassword())
                .build();
    }
}