package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.movement.HomeDepartmentResponseDto;
import com.epms.backend.dto.movement.MovementHistoryResponseDto;
import com.epms.backend.dto.movement.PermanentTransferRequestDto;
import com.epms.backend.dto.movement.ReportingHistoryRequestDto;
import com.epms.backend.dto.movement.ReportingHistoryResponseDto;
import com.epms.backend.dto.movement.ReturnRequestDto;
import com.epms.backend.dto.movement.TemporaryTransferRequestDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.EmployeeMovementService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@PreAuthorize("principal.roleId == 1")
public class EmployeeMovementController {

    private final EmployeeMovementService movementService;

    @PostMapping("/{employeeId}/movements/temporary-transfer")
    public ResponseEntity<ApiResponse<MovementHistoryResponseDto>> temporaryTransfer(
            @PathVariable Long employeeId,
            @Valid @RequestBody TemporaryTransferRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Temporary transfer completed",
                movementService.temporaryTransfer(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/movements/return")
    public ResponseEntity<ApiResponse<MovementHistoryResponseDto>> returnFromTemporary(
            @PathVariable Long employeeId,
            @Valid @RequestBody ReturnRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Return completed",
                movementService.returnFromTemporary(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/movements/permanent-transfer")
    public ResponseEntity<ApiResponse<MovementHistoryResponseDto>> permanentTransfer(
            @PathVariable Long employeeId,
            @Valid @RequestBody PermanentTransferRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Permanent transfer completed",
                movementService.permanentTransfer(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/movements")
    public ResponseEntity<ApiResponse<List<MovementHistoryResponseDto>>> getMovements(
            @PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Movement history retrieved",
                movementService.getMovementHistory(employeeId)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/movements/current")
    public ResponseEntity<ApiResponse<MovementHistoryResponseDto>> getCurrentMovement(
            @PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Current movement retrieved",
                movementService.getCurrentMovement(employeeId).orElse(null)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/home-department")
    public ResponseEntity<ApiResponse<HomeDepartmentResponseDto>> getHomeDepartment(
            @PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Home department retrieved",
                movementService.getHomeDepartment(employeeId)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/reporting-history")
    public ResponseEntity<ApiResponse<ReportingHistoryResponseDto>> assignManager(
            @PathVariable Long employeeId,
            @Valid @RequestBody ReportingHistoryRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Manager assigned",
                movementService.assignManager(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/reporting-history")
    public ResponseEntity<ApiResponse<List<ReportingHistoryResponseDto>>> getReportingHistory(
            @PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Reporting history retrieved",
                movementService.getReportingHistory(employeeId)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }
}
