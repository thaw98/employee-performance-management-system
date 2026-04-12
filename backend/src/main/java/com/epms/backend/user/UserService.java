package com.epms.backend.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.user.dto.UserProfileDto;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserProfileDto(
                user.getId(),
                user.getEmployee().getEmployeeId(),
                user.getEmployee().getEmployeeName(),
                user.getEmail(),
                user.getRole().getName(),
                user.getProfilePictureBase64());
    }

    @Transactional
    public UserProfileDto updateProfilePicture(Long userId, String profilePictureBase64) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setProfilePictureBase64(profilePictureBase64);
        User updatedUser = userRepository.save(user);

        return new UserProfileDto(
                updatedUser.getId(),
                updatedUser.getEmployee().getEmployeeId(),
                updatedUser.getEmployee().getEmployeeName(),
                updatedUser.getEmail(),
                updatedUser.getRole().getName(),
                updatedUser.getProfilePictureBase64());
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("New password and confirm password do not match");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

    }
}
