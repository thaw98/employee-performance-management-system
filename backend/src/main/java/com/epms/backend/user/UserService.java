package com.epms.backend.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.user.dto.UserProfileDto;

@Service
public class UserService {

<<<<<<< HEAD
        final 
        serRepository userRepository;
        private final PasswordEncoder passwordEncoder;

        
        public UserProfileDto getProfile(Long userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                return new UserProfileDto(
                                user.getId(),
                                user.getEmployeeId(),
                                user.getEmail(),
                                user.getRole().getName(),
                                user.getProfilePictureBase64());
        }
=======
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }
>>>>>>> 3ec857b160f9b0f9b004393ce3f2d6a162effab6

    @Transactional(readOnly = true)
    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserProfileDto(
                user.getId(),
                user.getEmployeeId(),
                user.getEmail(),
                user.getRole().getName(),
                user.getProfilePictureBase64()
        );
    }

<<<<<<< HEAD
                user.setProfilePictureBase64(profilePictureBase64);
                User updatedUser = userRepository.save(user);
=======
    @Transactional
    public UserProfileDto updateProfilePicture(Long userId, String profilePictureBase64) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setProfilePictureBase64(profilePictureBase64);
        User updatedUser = userRepository.save(user);
>>>>>>> 3ec857b160f9b0f9b004393ce3f2d6a162effab6

        return new UserProfileDto(
                updatedUser.getId(),
                updatedUser.getEmployeeId(),
                updatedUser.getEmail(),
<<<<<<< HEAD
                updatedUser.getRole().name(),
=======
                updatedUser.getRole().getName(),
                updatedUser.getProfilePictureBase64()
        );
    }

    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("New password and confirm password do not match");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
>>>>>>> 3ec857b160f9b0f9b004393ce3f2d6a162effab6
                
    public void changePassword(Long userId, String currentPassword, String newPassword, String confirmPassword) {
        if(!newPassword.equals(confirmPassword))

        {
                throw new RuntimeException("New password and confirm password do not match");
        }
<<<<<<< HEAD

        User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));

        if(!passwordEncoder.matches(currentPassword,user.getPasswordHash()))
        {
                throw new RuntimeException("Incorrect current password");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));userRepository.save(user);
}}
=======
        
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
>>>>>>> 3ec857b160f9b0f9b004393ce3f2d6a162effab6
