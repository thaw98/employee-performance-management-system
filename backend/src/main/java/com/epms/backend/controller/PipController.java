package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.pip.PipSignatureRequest;
import com.epms.backend.dto.pip.PipCreateRequest;
import com.epms.backend.dto.pip.EligibleEmployeeDTO;
import com.epms.backend.dto.pip.ProgressUpdateRequest;
import com.epms.backend.dto.pip.MeetingScheduleRequest;
import com.epms.backend.dto.pip.PipCloseRequest;
import com.epms.backend.dto.pip.PipReopenRequest;
import com.epms.backend.dto.pip.PipReviewRequest;
import com.epms.backend.dto.pip.PipCommunicationNoteDto;
import com.epms.backend.dto.pip.PipCommunicationNotePageDto;
import com.epms.backend.dto.pip.PipCommunicationNoteRequest;
import com.epms.backend.entity.*;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.PipService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pips")
@RequiredArgsConstructor
public class PipController {

    private final PipService pipService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<Pip>> createPip(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PipCreateRequest request) {
        User manager = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.createPip(request, manager);
        return ResponseEntity.ok(ApiResponse.ok("PIP created successfully", pip));
    }

    @GetMapping("/eligible-employees")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<EligibleEmployeeDTO>>> getEligibleEmployees(
            @AuthenticationPrincipal UserPrincipal principal) {
        User manager = userRepository.findById(principal.getId()).orElseThrow();
        return ResponseEntity
                .ok(ApiResponse.ok("Eligible employees retrieved successfully", pipService.getLowPerformers(manager)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Pip>>> getPips(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long positionId,
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        List<Pip> pips = pipService.searchPips(departmentId, positionId, employeeName, status, startDate, endDate,
                user);
        return ResponseEntity.ok(ApiResponse.ok("PIPs retrieved successfully", pips));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Pip>> getPipById(@AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok("PIP retrieved successfully", pipService.getPipById(id, user)));
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<PipCommunicationNotePageDto>> getPipNotes(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String noteType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "createdDate"));
        return ResponseEntity.ok(ApiResponse.ok("PIP notes retrieved successfully",
                pipService.getPipNotes(id, noteType, pageable, user)));
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<PipCommunicationNoteDto>> addPipNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody PipCommunicationNoteRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        return ResponseEntity
                .ok(ApiResponse.ok("PIP note added successfully", pipService.addPipNote(id, request, user)));
    }

    @GetMapping("/notes")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<ApiResponse<Page<PipCommunicationNoteDto>>> getAllPipNotes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long managerId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String employeeName,
            @RequestParam(required = false) String noteType,
            @RequestParam(required = false) String pipStatus,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "createdDate"));
        return ResponseEntity.ok(ApiResponse.ok("PIP notes retrieved successfully",
                pipService.getAllPipNotes(employeeId, managerId, departmentId, employeeName, noteType, pipStatus,
                        dateFrom, dateTo, pageable, user)));
    }

    @DeleteMapping("/notes/{noteId}")
    public ResponseEntity<ApiResponse<Void>> deletePipNote(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long noteId) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        pipService.deletePipNote(noteId, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP note deleted successfully", null));
    }

    @PutMapping("/objectives/{objectiveId}/progress")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<PipObjective>> updateProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long objectiveId,
            @RequestBody ProgressUpdateRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        PipObjective objective = pipService.updateObjectiveProgress(objectiveId, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Progress updated successfully", objective));
    }

    @PostMapping("/{id}/meetings")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<FollowUpMeeting>> scheduleMeeting(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody MeetingScheduleRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        FollowUpMeeting meeting = pipService.scheduleMeeting(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("Meeting scheduled successfully", meeting));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<Pip>> closePip(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody PipCloseRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.closePip(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP closed successfully", pip));
    }

    @PatchMapping("/{id}/completed")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<Pip>> markPipCompleted(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.markPipCompleted(id, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP marked completed successfully", pip));
    }

    @PutMapping("/{id}/reopen")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<Pip>> reopenPip(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody PipReopenRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.reopenPip(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP reopened successfully", pip));
    }

    @PostMapping("/{id}/employee-sign")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ApiResponse<Pip>> employeeSign(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) PipSignatureRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.employeeSign(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP signed successfully", pip));
    }

    @PostMapping("/{id}/manager-sign")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<Pip>> managerSign(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestBody(required = false) PipSignatureRequest request) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        Pip pip = pipService.managerSign(id, request, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP signed successfully", pip));
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
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

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<PipProgressUpdate>>> getPipHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        return ResponseEntity.ok(ApiResponse.ok("PIP history retrieved successfully",
                pipService.getPipHistory(id, user)));
    }

}
