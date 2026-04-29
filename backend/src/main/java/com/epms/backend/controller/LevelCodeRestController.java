package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.entity.LevelCode;
import com.epms.backend.repository.LevelCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/levels")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class LevelCodeRestController {

    private final LevelCodeRepository levelCodeRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LevelCode>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Fetched all level codes", levelCodeRepository.findAll()));
    }
}
