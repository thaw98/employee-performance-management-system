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
import com.epms.backend.user.dto.UpdateProfileRequestDto;
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
    public UserProfileDto deleteProfilePicture(Long userId) {
        User user = findUserById(userId);
        Employee employee = user.getEmployee();
        String currentUrl = employee.getProfilePictureUrl();
        if (currentUrl != null) {
            profilePictureStorageService.deleteIfStored(currentUrl);
            employee.setProfilePictureUrl(null);
            employeeRepository.save(employee);
        }
        return toUserProfileDto(user);
    }

    @Transactional
    public UserProfileDto updateWallpaper(Long userId, MultipartFile file) {
        User user = findUserById(userId);
        String previous = user.getWallpaperUrl();
        String url = profilePictureStorageService.store(file);
        profilePictureStorageService.deleteIfStored(previous);
        user.setWallpaperUrl(url);
        user.setTheme("wallpaper");
        userRepository.save(user);
        return toUserProfileDto(user);
    }

    @Transactional
    public UserProfileDto deleteWallpaper(Long userId) {
        User user = findUserById(userId);
        String currentUrl = user.getWallpaperUrl();
        if (currentUrl != null) {
            profilePictureStorageService.deleteIfStored(currentUrl);
            user.setWallpaperUrl(null);
            user.setTheme("light");
            userRepository.save(user);
        }
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

    @Transactional
    public UserProfileDto updateProfile(Long userId, UpdateProfileRequestDto request) {
        User user = findUserById(userId);
        Employee employee = user.getEmployee();

        if (request.getName() != null && !request.getName().isBlank()) {
            employee.setEmployeeName(request.getName());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            employee.setEmail(request.getEmail());
        }

        if (request.getTheme() != null && !request.getTheme().isBlank()) {
            user.setTheme(request.getTheme());
        }

        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            user.setLanguage(request.getLanguage());
        }

        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            user.setTimezone(request.getTimezone());
        }

        if (request.getTimeFormat() != null && !request.getTimeFormat().isBlank()) {
            user.setTimeFormat(request.getTimeFormat());
        }

        employeeRepository.save(employee);
        userRepository.save(user);

        return toUserProfileDto(user);
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserProfileDto toUserProfileDto(User user) {
        Employee employee = user.getEmployee();
        String profilePictureUrl = employee != null ? employee.getProfilePictureUrl() : null;
        if (profilePictureUrl != null && !profilePictureStorageService.isAvailable(profilePictureUrl)) {
            profilePictureUrl = null;
        }
        String employeeName = employee != null ? employee.getEmployeeName() : null;
        return new UserProfileDto(
                user.getId(),
                employee != null && employee.getId() != null ? String.valueOf(employee.getId()) : null,
                employeeName,
                user.getEmail(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getRole() != null ? user.getRole().getId() : null,
                profilePictureUrl,
                user.getTheme(),
                user.getWallpaperUrl(),
                user.getLanguage(),
                user.getTimezone(),
                user.getTimeFormat(),
                employee != null ? employee.getEmployeeId() : null,
                employeeName,
                resolveDepartmentName(employee),
                resolvePositionName(employee),
                employee != null && employee.getEmploymentStatus() != null ? employee.getEmploymentStatus().name() : null,
                employee != null && employee.getGender() != null ? employee.getGender().name() : null,
                employee != null ? employee.getStaffNrcNo() : null,
                employee != null ? employee.getDateOfJoining() : null);
    }

    private String resolveDepartmentName(Employee employee) {
        if (employee == null) {
            return null;
        }
        if (employee.getDepartmentPosition() != null && employee.getDepartmentPosition().getDepartment() != null) {
            return employee.getDepartmentPosition().getDepartment().getName();
        }
        if (employee.getDepartment() != null) {
            return employee.getDepartment().getName();
        }
        return null;
    }

    private String resolvePositionName(Employee employee) {
        if (employee == null) {
            return null;
        }
        if (employee.getDepartmentPosition() != null && employee.getDepartmentPosition().getPosition() != null) {
            return employee.getDepartmentPosition().getPosition().getName();
        }
        if (employee.getPosition() != null) {
            return employee.getPosition().getName();
        }
        return null;
    }
}
