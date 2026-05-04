package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.ReviewCycleDto;
import com.epms.backend.service.ReviewCycleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review-cycles")
public class ReviewCycleController {

    private final ReviewCycleService reviewCycleService;

    public ReviewCycleController(ReviewCycleService reviewCycleService) {
        this.reviewCycleService = reviewCycleService;
    }

    @GetMapping("/current-year/preview")
    public ResponseEntity<ApiResponse<List<ReviewCycleDto>>> previewCurrentYear() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Preview fetched", reviewCycleService.previewCurrentYear()));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<List<ReviewCycleDto>>> generate() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Review cycles generated", reviewCycleService.generateCurrentYear()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReviewCycleDto>>> getCycles(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String cycleType,
            @RequestParam(required = false) Boolean requiresEmployeeSubmission
    ) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Review cycles fetched",
                reviewCycleService.getCycles(status, cycleType, requiresEmployeeSubmission)));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ReviewCycleDto>>> getActiveCycles() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Active review cycles fetched", reviewCycleService.getActiveCycles()));
    }
}
