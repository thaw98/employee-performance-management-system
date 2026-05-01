package com.epms.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.EmployeeDetailResponseDto;
import com.epms.backend.dto.hr.EmployeeViewResponseDto;
import com.epms.backend.dto.hr.EmployeeListResponseDto;
import com.epms.backend.dto.hr.EmployeeUpdateRequestDto;
import com.epms.backend.dto.hr.EmploymentStatusHistoryResponseDto;
import com.epms.backend.dto.hr.HrCreateEmployeeAccountRequestDto;
import com.epms.backend.dto.hr.HrCreateEmployeeAccountResponseDto;
import com.epms.backend.dto.hr.NextStaffNoResponseDto;
import com.epms.backend.dto.hr.PasswordActionResponseDto;
import com.epms.backend.dto.hr.UpdateEmploymentStatusRequestDto;
import com.epms.backend.dto.hr.UserAccountRoleSyncResultDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.HrEmployeeAccountService;
import com.epms.backend.service.HrEmployeeService;
import com.epms.backend.service.UserAccountPositionRoleSyncService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/hr/employees")
@RequiredArgsConstructor
public class HrEmployeeController {

    private final HrEmployeeService hrEmployeeService;
    private final HrEmployeeAccountService hrEmployeeAccountService;
    private final UserAccountPositionRoleSyncService userAccountPositionRoleSyncService;

    @GetMapping
    public ResponseEntity<ApiResponse<EmployeeListResponseDto>> getEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long positionId,
            @RequestParam(required = false) String employmentStatus,
            @RequestParam(defaultValue = "employeeId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            EmployeeListResponseDto result = hrEmployeeService.getEmployeesForCurrentUser(page, size, search, departmentId, positionId, employmentStatus, sortBy, sortDir, principal);
            return ResponseEntity.ok(ApiResponse.ok("Employee list retrieved", result));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/kpi-status")
    public ResponseEntity<ApiResponse<EmployeeListResponseDto>> getEmployeesKpiStatus(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long positionId,
            @RequestParam(required = false) String kpiStatus,
            @RequestParam String period,
            @RequestParam(defaultValue = "employeeId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            EmployeeListResponseDto result = hrEmployeeService.getEmployeesWithKpiStatus(page, size, search, departmentId, positionId, kpiStatus, period, sortBy, sortDir, principal);
            return ResponseEntity.ok(ApiResponse.ok("Employee KPI status list retrieved", result));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<EmployeeDetailResponseDto>> getEmployee(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Employee detail retrieved", hrEmployeeService.getEmployeeByIdForCurrentUser(employeeId, principal)));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/view")
    public ResponseEntity<ApiResponse<EmployeeViewResponseDto>> viewEmployee(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Employee view detail retrieved", hrEmployeeService.getEmployeeViewByIdForCurrentUser(employeeId, principal)));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PutMapping("/{employeeId}")
    public ResponseEntity<ApiResponse<Void>> updateEmployee(
            @PathVariable Long employeeId,
            @Valid @RequestBody EmployeeUpdateRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            hrEmployeeService.updateEmployee(employeeId, request, principal);
            return ResponseEntity.ok(ApiResponse.ok("Employee updated successfully", null));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PatchMapping("/{employeeId}/employment-status")
    public ResponseEntity<ApiResponse<Void>> updateEmploymentStatus(
            @PathVariable Long employeeId,
            @Valid @RequestBody UpdateEmploymentStatusRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            hrEmployeeService.updateEmploymentStatus(employeeId, request, principal);
            return ResponseEntity.ok(ApiResponse.ok("Employment status updated", null));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @GetMapping("/{employeeId}/employment-status-history")
    public ResponseEntity<ApiResponse<List<EmploymentStatusHistoryResponseDto>>> getEmploymentStatusHistory(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            List<EmploymentStatusHistoryResponseDto> result = hrEmployeeService.getEmploymentStatusHistory(employeeId, principal);
            return ResponseEntity.ok(ApiResponse.ok("Employment status history retrieved", result));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/resend-password")
    public ResponseEntity<ApiResponse<PasswordActionResponseDto>> resendPassword(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Temporary password sent successfully", hrEmployeeService.resendTemporaryPassword(employeeId, principal)));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/{employeeId}/resend-temporary-password")
    public ResponseEntity<ApiResponse<PasswordActionResponseDto>> resendTemporaryPassword(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return resendPassword(employeeId, principal);
    }

    @PostMapping("/{employeeId}/send-new-password")
    public ResponseEntity<ApiResponse<PasswordActionResponseDto>> sendNewPassword(
            @PathVariable Long employeeId,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("New temporary password sent successfully", hrEmployeeService.sendNewTemporaryPassword(employeeId, principal)));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    // Consolidated from HrEmployeeAccountController
    @GetMapping("/next-staff-no")
    public ResponseEntity<ApiResponse<NextStaffNoResponseDto>> nextStaffNo(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            hrEmployeeService.validateHrOnlyAction(principal);
            return ResponseEntity.ok(ApiResponse.ok(
                    "Next staff number",
                    hrEmployeeAccountService.suggestNextStaffNo(principal)));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    /**
     * One-off maintenance: align user_account.role_id with employee's current position role.
     * Not invoked on startup; call explicitly when needed.
     */
    @PostMapping("/maintenance/sync-user-roles-from-positions")
    public ResponseEntity<ApiResponse<UserAccountRoleSyncResultDto>> syncUserRolesFromPositions(
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            hrEmployeeService.validateHrOnlyAction(principal);
            UserAccountRoleSyncResultDto result = userAccountPositionRoleSyncService.syncAll();
            return ResponseEntity.ok(ApiResponse.ok(result.getSummaryMessage(), result));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }

    @PostMapping("/create-account")
    public ResponseEntity<ApiResponse<HrCreateEmployeeAccountResponseDto>> createAccount(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody HrCreateEmployeeAccountRequestDto request) {
        try {
            hrEmployeeService.validateHrOnlyAction(principal);
            return ResponseEntity.ok(ApiResponse.ok(
                    "Employee account created",
                    hrEmployeeAccountService.createAccount(request, principal)));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        }
    }
}
