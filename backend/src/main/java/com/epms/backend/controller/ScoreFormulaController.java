package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.scoreformula.CreateScoreFormulaRequest;
import com.epms.backend.dto.scoreformula.ScoreFormulaDto;
import com.epms.backend.dto.scoreformula.UpdateScoreFormulaRequest;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.ScoreFormulaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/score-formulas")
@RequiredArgsConstructor
public class ScoreFormulaController {

    private final ScoreFormulaService scoreFormulaService;

    @GetMapping
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<List<ScoreFormulaDto>>> getFormulasByArea(
            @RequestParam String area) {
        List<ScoreFormulaDto> formulas = scoreFormulaService.getFormulasByArea(area);
        return ResponseEntity.ok(ApiResponse.ok("Formulas fetched successfully", formulas));
    }

    @GetMapping("/{id}")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<ScoreFormulaDto>> getFormula(@PathVariable Long id) {
        ScoreFormulaDto formula = scoreFormulaService.getFormula(id);
        return ResponseEntity.ok(ApiResponse.ok("Formula fetched successfully", formula));
    }

    @PostMapping
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<ScoreFormulaDto>> createFormula(
            @Valid @RequestBody CreateScoreFormulaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ScoreFormulaDto formula = scoreFormulaService.createFormula(request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Formula created successfully", formula));
    }

    @PutMapping("/{id}")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<ScoreFormulaDto>> updateFormula(
            @PathVariable Long id,
            @Valid @RequestBody UpdateScoreFormulaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ScoreFormulaDto formula = scoreFormulaService.updateFormula(id, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Formula updated successfully", formula));
    }

    @PutMapping("/{id}/set-default")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<ScoreFormulaDto>> setDefaultFormula(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ScoreFormulaDto formula = scoreFormulaService.setDefaultFormula(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Default formula set successfully", formula));
    }

    @PutMapping("/{id}/inactivate")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<ScoreFormulaDto>> inactivateFormula(
            @PathVariable Long id,
            @RequestParam(required = false) Long replacementId,
            @AuthenticationPrincipal UserPrincipal principal) {
        ScoreFormulaDto formula = scoreFormulaService.inactivateFormula(id, replacementId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("Formula inactivated successfully", formula));
    }

    @GetMapping("/default/{area}")
    @PreAuthorize("principal.roleId == 1")
    public ResponseEntity<ApiResponse<ScoreFormulaDto>> getActiveDefaultFormula(@PathVariable String area) {
        ScoreFormulaDto formula = scoreFormulaService.getActiveDefaultFormula(area);
        return ResponseEntity.ok(ApiResponse.ok("Active default formula fetched successfully", formula));
    }
}
