package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.*;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.MeetingStatus;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.MeetingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/meetings")
@RequiredArgsConstructor
public class MeetingController {

    private final MeetingService meetingService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'schedule')")
    public ResponseEntity<ApiResponse<MeetingResponse>> scheduleMeeting(@RequestBody MeetingRequest request) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.scheduleMeeting(user.getEmployee().getId(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting scheduled successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/request")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'request')")
    public ResponseEntity<ApiResponse<MeetingResponse>> requestMeeting(@RequestBody MeetingRequest request) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.requestMeeting(user.getEmployee().getId(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting requested successfully", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/requestable-managers")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'request')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRequestableManagers() {
        try {
            User user = getCurrentUser();
            List<Employee> managers = meetingService.getRequestableManagers(user.getEmployee().getId());
            List<Map<String, Object>> response = managers.stream().map(e -> Map.<String, Object>of(
                    "id", e.getId(),
                    "name", e.getEmployeeName(),
                    "department", e.getDepartment() != null ? e.getDepartment().getName() : "N/A",
                    "position", e.getPosition() != null ? e.getPosition().getName() : "N/A"))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>(true, "Requestable managers fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/history")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'history')")
    public ResponseEntity<ApiResponse<Page<MeetingResponse>>> getMeetingHistory(
            @RequestParam(required = false) String statuses,
            @RequestParam(required = false) String searchName,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            List<MeetingStatus> statusList = parseStatuses(statuses);
            java.time.Instant from = (fromDate != null && !fromDate.isBlank()) ? java.time.Instant.parse(fromDate)
                    : null;
            java.time.Instant to = (toDate != null && !toDate.isBlank()) ? java.time.Instant.parse(toDate) : null;
            org.springframework.data.domain.Sort sort = switch (sortBy) {
                case "oldest" -> org.springframework.data.domain.Sort.by("scheduledTime").ascending();
                case "name_asc" -> org.springframework.data.domain.Sort.by("employee.employeeName").ascending();
                case "name_desc" -> org.springframework.data.domain.Sort.by("employee.employeeName").descending();
                default -> org.springframework.data.domain.Sort.by("scheduledTime").descending();
            };

            Page<MeetingResponse> response = meetingService.getMeetingHistory(
                    statusList, searchName, departmentId, from, to, PageRequest.of(page, size, sort));
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting history fetched", response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Server Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/manager")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'view')")
    public ResponseEntity<ApiResponse<Page<MeetingResponse>>> getManagerMeetings(
            @RequestParam(required = false) String statuses,
            @RequestParam(required = false) String searchName,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User user = getCurrentUser();
            if (user.getEmployee() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "User is not associated with an employee record", null));
            }
            List<MeetingStatus> statusList = null;
            if (statuses != null && !statuses.isBlank()) {
                statusList = java.util.Arrays.stream(statuses.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(s -> {
                            try {
                                return MeetingStatus.valueOf(s);
                            } catch (Exception e) {
                                return null;
                            }
                        })
                        .filter(java.util.Objects::nonNull)
                        .collect(Collectors.toList());
            }

            java.time.Instant from = (fromDate != null && !fromDate.isBlank()) ? java.time.Instant.parse(fromDate)
                    : null;
            java.time.Instant to = (toDate != null && !toDate.isBlank()) ? java.time.Instant.parse(toDate) : null;

            org.springframework.data.domain.Sort sort = switch (sortBy) {
                case "oldest" -> org.springframework.data.domain.Sort.by("scheduledTime").ascending();
                case "name_asc" -> org.springframework.data.domain.Sort.by("employee.employeeName").ascending();
                case "name_desc" -> org.springframework.data.domain.Sort.by("employee.employeeName").descending();
                default -> org.springframework.data.domain.Sort.by("scheduledTime").descending();
            };

            Page<MeetingResponse> response = meetingService.getManagerMeetings(
                    user.getEmployee().getId(), statusList, searchName, departmentId, from, to,
                    PageRequest.of(page, size, sort));
            return ResponseEntity.ok(new ApiResponse<>(true, "Manager meetings fetched", response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Server Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/employee")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'view')")
    public ResponseEntity<ApiResponse<Page<MeetingResponse>>> getEmployeeMeetings(
            @RequestParam(required = false) String statuses,
            @RequestParam(required = false) String searchName,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User user = getCurrentUser();
            if (user.getEmployee() == null) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "User is not associated with an employee record", null));
            }
            List<MeetingStatus> statusList = null;
            if (statuses != null && !statuses.isBlank()) {
                statusList = java.util.Arrays.stream(statuses.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(s -> {
                            try {
                                return MeetingStatus.valueOf(s);
                            } catch (Exception e) {
                                return null;
                            }
                        })
                        .filter(java.util.Objects::nonNull)
                        .collect(Collectors.toList());
            }

            java.time.Instant from = (fromDate != null && !fromDate.isBlank()) ? java.time.Instant.parse(fromDate)
                    : null;
            java.time.Instant to = (toDate != null && !toDate.isBlank()) ? java.time.Instant.parse(toDate) : null;

            org.springframework.data.domain.Sort sort = switch (sortBy) {
                case "oldest" -> org.springframework.data.domain.Sort.by("scheduledTime").ascending();
                case "name_asc" -> org.springframework.data.domain.Sort.by("manager.employeeName").ascending();
                case "name_desc" -> org.springframework.data.domain.Sort.by("manager.employeeName").descending();
                default -> org.springframework.data.domain.Sort.by("scheduledTime").descending();
            };

            Page<MeetingResponse> response = meetingService.getEmployeeMeetings(
                    user.getEmployee().getId(), statusList, searchName, departmentId, from, to,
                    PageRequest.of(page, size, sort));
            return ResponseEntity.ok(new ApiResponse<>(true, "Employee meetings fetched", response));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Server Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/eligible-employees")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'schedule')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEligibleEmployees() {
        try {
            User user = getCurrentUser();
            List<Employee> eligible = meetingService.getEligibleEmployees(user.getEmployee().getId());
            List<Map<String, Object>> response = eligible.stream().map(e -> Map.<String, Object>of(
                    "id", e.getId(),
                    "name", e.getEmployeeName(),
                    "department", e.getDepartment() != null ? e.getDepartment().getName() : "N/A",
                    "position", e.getPosition() != null ? e.getPosition().getName() : "N/A"))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>(true, "Eligible employees fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/hr-employees")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'request')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHrEmployees() {
        try {
            User user = getCurrentUser();
            Long requesterEmployeeId = user.getEmployee() != null ? user.getEmployee().getId() : null;
            List<Employee> eligible = meetingService.getHrEmployees(requesterEmployeeId);
            List<Map<String, Object>> response = eligible.stream().map(e -> Map.<String, Object>of(
                    "id", e.getId(),
                    "name", e.getEmployeeName(),
                    "department", e.getDepartment() != null ? e.getDepartment().getName() : "N/A",
                    "position", e.getPosition() != null ? e.getPosition().getName() : "N/A"))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>(true, "HR employees fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/pip-follow-ups/{pipId}")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'view')")
    public ResponseEntity<ApiResponse<List<PipFollowUpMeetingResponse>>> getPipFollowUpMeetings(@PathVariable Long pipId) {
        try {
            User user = getCurrentUser();
            List<PipFollowUpMeetingResponse> response = meetingService.getPipFollowUpMeetings(pipId, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "PIP follow-up meetings fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'view')")
    public ResponseEntity<ApiResponse<MeetingResponse>> getMeetingDetails(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.getMeetingDetails(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting details fetched", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/accept")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'view')")
    public ResponseEntity<ApiResponse<MeetingResponse>> acceptMeeting(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.acceptMeeting(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting accepted", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/decline")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'view')")
    public ResponseEntity<ApiResponse<MeetingResponse>> declineMeeting(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.declineMeeting(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting declined", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'reschedule')")
    public ResponseEntity<ApiResponse<MeetingResponse>> requestReschedule(@PathVariable Long id,
            @RequestBody MeetingRescheduleRequest request) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.requestReschedule(id, user.getId(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Reschedule requested", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/accept-reschedule")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'reschedule')")
    public ResponseEntity<ApiResponse<MeetingResponse>> acceptReschedule(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.acceptReschedule(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Reschedule accepted", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'finish')")
    public ResponseEntity<ApiResponse<MeetingResponse>> updateStatus(@PathVariable Long id,
            @RequestBody MeetingStatusUpdateRequest request) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.updateStatus(id, user.getId(), request.status());
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting status updated", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'cancel')")
    public ResponseEntity<ApiResponse<MeetingResponse>> cancelMeeting(@PathVariable Long id,
            @RequestBody MeetingCancelRequest request) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.cancelMeeting(id, user.getId(), request.reason());
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting cancelled", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/request-cancel")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'cancel')")
    public ResponseEntity<ApiResponse<MeetingResponse>> requestCancel(@PathVariable Long id,
            @RequestBody MeetingCancelRequest request) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.requestCancel(id, user.getId(), request.reason());
            return ResponseEntity.ok(new ApiResponse<>(true, "Cancellation requested", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/approve-cancel")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'approve_cancel')")
    public ResponseEntity<ApiResponse<MeetingResponse>> approveCancel(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.approveCancel(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Cancellation approved", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/reject-cancel")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'approve_cancel')")
    public ResponseEntity<ApiResponse<MeetingResponse>> rejectCancel(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.rejectCancel(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Cancellation rejected", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/finish")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'finish')")
    public ResponseEntity<ApiResponse<MeetingResponse>> finishMeeting(@PathVariable Long id,
            @RequestBody MeetingFinishRequest request) {
        try {
            User user = getCurrentUser();
            MeetingResponse response = meetingService.finishMeeting(id, user.getId(), request.summaryNotes());
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting finished", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/{id}/notes")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'notes')")
    public ResponseEntity<ApiResponse<List<MeetingNoteResponse>>> getMeetingNotes(@PathVariable Long id) {
        try {
            User user = getCurrentUser();
            List<MeetingNoteResponse> notes = meetingService.getMeetingNotes(id, user.getId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Meeting notes fetched", notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("@permissionGuard.has('MEETINGS', 'notes')")
    public ResponseEntity<ApiResponse<MeetingNoteResponse>> addMeetingNote(@PathVariable Long id,
            @RequestBody MeetingNoteRequest request) {
        try {
            User user = getCurrentUser();
            MeetingNoteResponse note = meetingService.addNote(id, user.getId(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Note added", note));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    private User getCurrentUser() {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            Long userId = Long.parseLong(userIdStr);
            return userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        } catch (NumberFormatException e) {
            throw new RuntimeException("Invalid user ID in security context: " + userIdStr);
        }
    }

    private List<MeetingStatus> parseStatuses(String statuses) {
        if (statuses == null || statuses.isBlank()) {
            return null;
        }
        return java.util.Arrays.stream(statuses.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return MeetingStatus.valueOf(s);
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }
}
