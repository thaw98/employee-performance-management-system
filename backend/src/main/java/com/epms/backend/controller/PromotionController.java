package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.PromotionRequestDto;
import com.epms.backend.dto.position.PositionDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.PromotionService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping("/employee/{employeeId}/execute")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<Void>> executePromotion(
            @PathVariable Long employeeId,
            @Valid @RequestBody PromotionRequestDto request,
            @AuthenticationPrincipal UserPrincipal actor) {
        promotionService.executePromotion(employeeId, request, actor);
        return ResponseEntity.ok(ApiResponse.ok("Employee promoted successfully", null));
    }

    @GetMapping("/employee/{employeeId}/available-positions")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<List<PositionDto>>> getAvailablePositions(
            @PathVariable Long employeeId) {
        List<PositionDto> positions = promotionService.getAvailablePositions(employeeId);
        return ResponseEntity.ok(ApiResponse.ok("Success", positions));
    }
}
