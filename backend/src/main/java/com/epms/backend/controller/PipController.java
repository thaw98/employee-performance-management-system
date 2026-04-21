package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.pip.*;
import com.epms.backend.dto.pip.EligibleEmployeeDTO;
import com.epms.backend.entity.*;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.PipService;
import com.epms.backend.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pips")
@RequiredArgsConstructor
public class PipController {

    private final PipService pipService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD')")
    public ResponseEntity<ApiResponse<Pip>> createPip(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PipCreateRequest request) {
        User manager = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.createPip(request, manager);
        return ResponseEntity.ok(ApiResponse.ok("PIP created successfully", pip));
    }

    @GetMapping("/eligible-employees")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD')")
    public ResponseEntity<ApiResponse<List<EligibleEmployeeDTO>>> getEligibleEmployees(
            @AuthenticationPrincipal UserPrincipal principal) {
        User manager = userRepository.findById(principal.getId()).orElseThrow();
        return ResponseEntity
                .ok(ApiResponse.ok("Eligible employees retrieved successfully", pipService.getLowPerformers(manager)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Pip>>> getPips(@AuthenticationPrincipal UserPrincipal principal) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        List<Pip> pips;
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HR"))) {
            pips = pipService.getAllPips();
        } else if (principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().matches("ROLE_(DEPARTMENT|TEAM)_HEAD"))) {
            pips = pipService.getManagerPips(user);
        } else {
            pips = pipService.getEmployeePips(user);
        }
        return ResponseEntity.ok(ApiResponse.ok("PIPs retrieved successfully", pips));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Pip>> getPipById(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok("PIP retrieved successfully", pipService.getPipById(id, user)));
    }

    @PutMapping("/objectives/{objectiveId}/progress")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD')")
    public ResponseEntity<ApiResponse<PipObjective>> updateProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long objectiveId,
            @RequestBody ProgressUpdateRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        PipObjective objective = pipService.updateObjectiveProgress(objectiveId, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Progress updated successfully", objective));
    }

    @PostMapping("/{id}/meetings")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD')")
    public ResponseEntity<ApiResponse<FollowUpMeeting>> scheduleMeeting(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody MeetingScheduleRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        FollowUpMeeting meeting = pipService.scheduleMeeting(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Meeting scheduled successfully", meeting));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD')")
    public ResponseEntity<ApiResponse<Pip>> closePip(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody PipCloseRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.closePip(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP closed successfully", pip));
    }

    @PutMapping("/{id}/reopen")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD')")
    public ResponseEntity<ApiResponse<Pip>> reopenPip(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody PipReopenRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.reopenPip(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP reopened successfully", pip));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<Pip>> reviewPip(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody PipReviewRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.reviewPip(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP reviewed successfully", pip));
    }

    @GetMapping("/employees/{employeeId}/training")
    public ResponseEntity<ApiResponse<List<TrainingRecord>>> getTrainingHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.ok("Training history retrieved successfully",
                pipService.getEmployeeTrainingHistory(employeeId)));
    }

    @GetMapping("/objectives/{objectiveId}/history")
    public ResponseEntity<ApiResponse<List<PipProgressUpdate>>> getObjectiveHistory(@PathVariable Long objectiveId) {
        return ResponseEntity.ok(ApiResponse.ok("Objective history retrieved successfully",
                pipService.getObjectiveHistory(objectiveId)));
    }
}
