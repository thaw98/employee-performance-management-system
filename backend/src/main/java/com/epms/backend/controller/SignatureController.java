package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.SaveDrawnSignatureRequestDto;
import com.epms.backend.dto.SignatureDto;
import com.epms.backend.entity.Signature;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.SignatureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/signatures")
@RequiredArgsConstructor
public class SignatureController {

    private final SignatureService signatureService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SignatureDto>>> getMySignatures(@AuthenticationPrincipal UserPrincipal principal) {
        User user = getUser(principal);
        List<SignatureDto> signatures = signatureService.getUserSignatures(user).stream()
                .map(SignatureDto::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Signatures fetched", signatures));
    }

    @GetMapping("/default")
    public ResponseEntity<ApiResponse<SignatureDto>> getDefaultSignature(@AuthenticationPrincipal UserPrincipal principal) {
        User user = getUser(principal);
        return signatureService.getDefaultSignature(user)
                .map(SignatureDto::from)
                .map(s -> ResponseEntity.ok(ApiResponse.ok("Default signature found", s)))
                .orElse(ResponseEntity.ok(ApiResponse.ok("No default signature found", null)));
    }

    @PostMapping("/drawn")
    public ResponseEntity<ApiResponse<SignatureDto>> saveDrawnSignature(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SaveDrawnSignatureRequestDto request) {
        try {
            User user = getUser(principal);
            Signature saved = signatureService.saveDrawnSignature(user, request.getSignaturePngDataUrl());
            return ResponseEntity.ok(ApiResponse.ok("Default signature saved", SignatureDto.from(saved)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SignatureDto>> uploadSignature(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        try {
            User user = getUser(principal);
            Signature saved = signatureService.saveUploadedSignature(user, file);
            return ResponseEntity.ok(ApiResponse.ok("Default signature uploaded", SignatureDto.from(saved)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        }
    }

    private User getUser(UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findById(principal.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
