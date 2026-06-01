package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.score.BulkUpdateScoreExplanationRequest;
import com.epms.backend.dto.score.ScoreExplanationDto;
import com.epms.backend.dto.score.UpdateScoreExplanationRequest;
import com.epms.backend.entity.ScoreExplanationModule;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.ScoreExplanationService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/score-explanations")
@RequiredArgsConstructor
public class ScoreExplanationController {
    private final ScoreExplanationService service;

    @GetMapping(params = "module")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ScoreExplanationDto>>> getByModule(@RequestParam ScoreExplanationModule module) {
        return ResponseEntity.ok(ApiResponse.ok("Fetched score explanations", service.getByModule(module)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, List<ScoreExplanationDto>>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok("Fetched score explanations", service.getAll()));
    }

    @PutMapping("/{rowId}")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<List<ScoreExplanationDto>>> update(
            @PathVariable Long rowId,
            @RequestBody UpdateScoreExplanationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Updated score explanation", service.update(rowId, request, principal)));
    }

    @PutMapping("/bulk")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<List<ScoreExplanationDto>>> bulkUpdate(
            @RequestBody BulkUpdateScoreExplanationRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ApiResponse.ok("Bulk updated score explanations", service.bulkUpdate(request, principal)));
    }
}
