package com.epms.backend.controller;

import com.epms.backend.service.UserService;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.user.dto.ChangePasswordRequestDto;
import com.epms.backend.user.dto.UpdateProfileRequestDto;
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

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequestDto request) {
        try {
            UserProfileDto profile = userService.updateProfile(principal.getId(), request);
            return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", profile));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PutMapping(value = "/picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfilePicture(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        try {
            UserProfileDto profile = userService.updateProfilePicture(principal.getId(), file);
            return ResponseEntity.ok(ApiResponse.ok("Profile picture updated successfully", profile));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequestDto request) {
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
}
