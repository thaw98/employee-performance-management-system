package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.entity.Signature;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.SignatureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/signatures")
@RequiredArgsConstructor
public class SignatureController {

    private final SignatureService signatureService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Signature>>> getMySignatures(Authentication authentication) {
        User user = getUser(authentication);
        List<Signature> signatures = signatureService.getUserSignatures(user);
        return ResponseEntity.ok(ApiResponse.ok("Signatures fetched", signatures));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Signature>> saveSignature(Authentication authentication, @RequestBody SignatureRequest req) {
        User user = getUser(authentication);
        Signature saved = signatureService.saveSignature(user, req.getData(), req.getType(), req.isSetAsDefault());
        return ResponseEntity.ok(ApiResponse.ok("Signature saved", saved));
    }

    @GetMapping("/default")
    public ResponseEntity<ApiResponse<Signature>> getDefaultSignature(Authentication authentication) {
        User user = getUser(authentication);
        return signatureService.getDefaultSignature(user)
                .map(s -> ResponseEntity.ok(ApiResponse.ok("Default signature found", s)))
                .orElse(ResponseEntity.ok(ApiResponse.ok("No default signature found", null)));
    }

    private User getUser(Authentication authentication) {
        com.epms.backend.security.UserPrincipal principal = (com.epms.backend.security.UserPrincipal) authentication.getPrincipal();
        return userRepository.findById(principal.getId()).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @lombok.Data
    public static class SignatureRequest {
        private String data;
        private String type;
        private boolean setAsDefault;
    }
}
