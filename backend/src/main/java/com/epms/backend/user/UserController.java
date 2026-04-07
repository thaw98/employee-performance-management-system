package com.epms.backend.user;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.user.dto.UpdateProfilePictureRequestDto;
import com.epms.backend.user.dto.UserProfileDto;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserProfileDto profile = userService.getProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Profile retrieved successfully", profile));
    }

    @PutMapping("/picture")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfilePicture(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfilePictureRequestDto request) {
        try {
            UserProfileDto profile = userService.updateProfilePicture(principal.getId(), request.getProfilePictureBase64());
            return ResponseEntity.ok(ApiResponse.ok("Profile picture updated successfully", profile));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }
}
