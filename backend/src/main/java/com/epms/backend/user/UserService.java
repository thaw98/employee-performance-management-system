package com.epms.backend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.domain.user.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.user.dto.UpdateProfileRequestDto;
import com.epms.backend.user.dto.UserProfileDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserProfileDto(
                user.getId(),
                user.getEmployeeId(),
                user.getEmail(),
                user.getRole().name(),
                user.getProfilePictureBase64()
        );
    }

    @Transactional
    public UserProfileDto updateProfilePicture(Long userId, String profilePictureBase64) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setProfilePictureBase64(profilePictureBase64);
        User updatedUser = userRepository.save(user);

        return new UserProfileDto(
                updatedUser.getId(),
                updatedUser.getEmployeeId(),
                updatedUser.getEmail(),
                updatedUser.getRole().name(),
                updatedUser.getProfilePictureBase64()
        );
    }
}
