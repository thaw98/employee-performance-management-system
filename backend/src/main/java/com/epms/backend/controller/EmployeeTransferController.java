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
import com.epms.backend.dto.transfer.HomeDepartmentResponseDto;
import com.epms.backend.dto.transfer.MakePermanentRequestDto;
import com.epms.backend.dto.transfer.PermanentTransferRequestDto;
import com.epms.backend.dto.transfer.ReportingHistoryRequestDto;
import com.epms.backend.dto.transfer.ReportingHistoryResponseDto;
import com.epms.backend.dto.transfer.ReturnRequestDto;
import com.epms.backend.dto.transfer.TemporaryTransferRequestDto;
import com.epms.backend.dto.transfer.TransferHistoryResponseDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.EmployeeTransferService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@PreAuthorize("principal.roleId == 1 or principal.roleId == 5")
public class EmployeeTransferController {

    private final EmployeeTransferService transferService;

    @PostMapping("/{employeeId}/transfers/temporary")
    public ResponseEntity<ApiResponse<TransferHistoryResponseDto>> temporaryTransfer(
            @PathVariable Long employeeId,
            @Valid @RequestBody TemporaryTransferRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Temporary transfer completed",
                transferService.temporaryTransfer(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/transfers/return")
    public ResponseEntity<ApiResponse<TransferHistoryResponseDto>> returnFromTemporary(
            @PathVariable Long employeeId,
            @Valid @RequestBody ReturnRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Return completed",
                transferService.returnFromTemporary(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/transfers/permanent")
    public ResponseEntity<ApiResponse<TransferHistoryResponseDto>> permanentTransfer(
            @PathVariable Long employeeId,
            @Valid @RequestBody PermanentTransferRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Permanent transfer completed",
                transferService.permanentTransfer(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/transfers/make-permanent")
    public ResponseEntity<ApiResponse<TransferHistoryResponseDto>> makePermanent(
            @PathVariable Long employeeId,
            @Valid @RequestBody MakePermanentRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Transfer made permanent",
                transferService.makePermanent(employeeId, request, principal)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/transfers")
    public ResponseEntity<ApiResponse<List<TransferHistoryResponseDto>>> getTransfers(
            @PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Transfer history retrieved",
                transferService.getTransferHistory(employeeId)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/transfers/current")
    public ResponseEntity<ApiResponse<TransferHistoryResponseDto>> getCurrentTransfer(
            @PathVariable Long employeeId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok(
                "Current transfer retrieved",
                transferService.getCurrentTransfer(employeeId).orElse(null)));
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
                transferService.getHomeDepartment(employeeId)));
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
                transferService.assignManager(employeeId, request, principal)));
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
                transferService.getReportingHistory(employeeId)));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }
}
