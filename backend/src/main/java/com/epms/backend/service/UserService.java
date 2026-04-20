package com.epms.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.user.dto.UserProfileDto;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final ProfilePictureStorageService profilePictureStorageService;

    public UserService(
            UserRepository userRepository,
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            AuditService auditService,
            ProfilePictureStorageService profilePictureStorageService) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.profilePictureStorageService = profilePictureStorageService;
    }

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(Long userId) {
        return toUserProfileDto(findUserById(userId));
    }

    @Transactional
    public UserProfileDto updateProfilePicture(Long userId, MultipartFile file) {
        User user = findUserById(userId);
        Employee employee = user.getEmployee();
        String previous = employee.getProfilePictureUrl();
        String url = profilePictureStorageService.store(file);
        profilePictureStorageService.deleteIfStored(previous);
        employee.setProfilePictureUrl(url);
        employeeRepository.save(employee);
        return toUserProfileDto(user);
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        if (newPassword == null || confirmPassword == null) {
            throw new RuntimeException("Password fields are required");
        }

        if (newPassword.isBlank()) {
            throw new RuntimeException("New password cannot be blank");
        }

        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        User user = findUserById(userId);

        boolean forcedFirstLogin = user.isMustChangePassword();

        if (!forcedFirstLogin) {
            if (currentPassword == null || currentPassword.isBlank()) {
                throw new RuntimeException("Current password is required");
            }
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        if (forcedFirstLogin) {
            String description = "Employee user_account_id %d completed first-login password change".formatted(user.getId());
            auditService.record(
                    AuditActionType.PASSWORD_CHANGED_FIRST_LOGIN,
                    AuditTargetType.USER_ACCOUNT,
                    user.getId(),
                    user.getId(),
                    user.getRole().getId(),
                    description,
                    null);
        }
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserProfileDto toUserProfileDto(User user) {
        return new UserProfileDto(
                user.getId(),
                String.valueOf(user.getEmployee().getId()),
                user.getEmployee().getEmployeeName(),
                user.getEmail(),
                user.getRole().getName(),
                user.getEmployee().getProfilePictureUrl());
    }
}
