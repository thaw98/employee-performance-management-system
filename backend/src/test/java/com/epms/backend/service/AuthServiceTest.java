package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.epms.backend.dto.LoginRequestDto;
import com.epms.backend.dto.LoginResponseDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Test
    void loginReturnsNullExpiresAt() {
        User user = user();
        when(userRepository.findFirstByEmployee_EmailIgnoreCaseOrderByActiveDescIdAsc("test@example.com"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "encoded")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt-token");
        when(jwtService.calculateExpirationInstant()).thenReturn(null);

        AuthService authService = new AuthService(userRepository, passwordEncoder, jwtService);
        LoginRequestDto request = new LoginRequestDto();
        request.setEmail(" Test@Example.com ");
        request.setPassword("password");

        LoginResponseDto response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertNull(response.getExpiresAt());
        assertSame(user.getId(), response.getUser().getId());
    }

    private static User user() {
        Employee employee = new Employee();
        employee.setId(100L);
        employee.setEmployeeId("EMP-100");
        employee.setEmployeeName("Test User");
        employee.setEmail("test@example.com");

        Role role = new Role();
        role.setId(1L);
        role.setName("HR");

        User user = new User();
        user.setId(10L);
        user.setEmployee(employee);
        user.setRole(role);
        user.setPassword("encoded");
        user.setActive(true);
        return user;
    }
}
