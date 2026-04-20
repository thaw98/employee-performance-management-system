package com.epms.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.RoleRepository;
import com.epms.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@Order(2)
@ConditionalOnProperty(name = "epms.autoseed.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "12345678";

    @Override
    public void run(String... args) {
        // Only create users if no users exist
        if (userRepository.count() > 0) {
            log.info("Users already exist, skipping initialization");
            return;
        }
        
        log.info("Creating initial admin users...");
        
        // Create HR Admin
        createUser("admin@gmail.com", "System Administrator", 1L);
        
        // Create HR Manager
        createUser("hr@gmail.com", "HR Manager", 1L);
        
        // Create Department Manager
        createUser("manager@gmail.com", "Department Manager", 2L);
        
        // Create Team Lead
        createUser("teamlead@gmail.com", "Team Lead", 3L);
        
        // Create Employees
        createUser("employee1@gmail.com", "John Employee", 4L);
        createUser("employee2@gmail.com", "Jane Employee", 4L);
        
        log.info("Created {} users with password: {}", userRepository.count(), DEFAULT_PASSWORD);
    }

    private void createUser(String email, String name, Long roleId) {
        // Create Employee
        Employee employee = new Employee();
        employee.setEmployeeName(name);
        employee.setEmployeeId(generateEmployeeId(email));
        employee.setStatus("Active");
        employee.setEmail(email);
        employee = employeeRepository.save(employee);

        // Create User
        User user = new User();
        user.setEmployee(employee);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(DEFAULT_PASSWORD));
        user.setRole(roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalStateException("Role id " + roleId + " not found")));
        user.setActive(true);
        user.setMustChangePassword(false);
        userRepository.save(user);
        
        log.debug("Created user: {} with role ID: {}", email, roleId);
    }

    private String generateEmployeeId(String email) {
        String prefix = email.split("@")[0];
        return prefix.toUpperCase() + "-" + System.currentTimeMillis();
    }
}