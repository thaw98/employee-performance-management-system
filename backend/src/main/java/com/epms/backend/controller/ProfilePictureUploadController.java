package com.epms.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.ProfilePictureUploadResponseDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.ProfilePictureStorageService;

import lombok.RequiredArgsConstructor;

/**
 * Stores an image on disk and returns a URL path for use in create-account JSON payloads.
 */
@RestController
@RequestMapping("/api/files/profile-pictures")
@RequiredArgsConstructor
public class ProfilePictureUploadController {

	private final ProfilePictureStorageService profilePictureStorageService;

	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<ApiResponse<ProfilePictureUploadResponseDto>> upload(
			@AuthenticationPrincipal UserPrincipal principal,
			@RequestParam("file") MultipartFile file) {
		if (principal == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		try {
			String url = profilePictureStorageService.store(file);
			return ResponseEntity.ok(ApiResponse.ok("Uploaded", new ProfilePictureUploadResponseDto(url)));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
		}
	}
}
