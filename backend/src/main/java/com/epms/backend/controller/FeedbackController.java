package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackSubmissionRequest;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.User;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.FeedbackService;
import com.epms.backend.service.TimeSettingService;
import com.epms.backend.dto.TimeSettingDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final TimeSettingService timeSettingService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitFeedback(@RequestBody FeedbackSubmissionRequest request) {
        try {
            User user = getCurrentUser();
            feedbackService.submitFeedback(user.getEmployee().getId(), request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Feedback submitted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Submit Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<FeedbackHistoryDto>>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User user = getCurrentUser();
            Page<FeedbackHistoryDto> history = feedbackService.getFeedbackHistory(user.getEmployee().getId(), PageRequest.of(page, size));
            return ResponseEntity.ok(new ApiResponse<>(true, "History fetched", history));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "History Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/received")
    public ResponseEntity<ApiResponse<Page<FeedbackHistoryDto>>> getReceived(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User user = getCurrentUser();
            Page<FeedbackHistoryDto> received = feedbackService.getReceivedFeedback(user.getEmployee().getId(), PageRequest.of(page, size));
            return ResponseEntity.ok(new ApiResponse<>(true, "Received feedback fetched", received));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Received Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/eligible-evaluatees")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getEligible(@RequestParam String role) {
        try {
            User user = getCurrentUser();
            List<Employee> eligible = feedbackService.getEligibleEvaluatees(user.getEmployee().getId(), role);
            
            List<Map<String, Object>> result = eligible.stream().map(e -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", e.getId());
                m.put("name", e.getEmployeeName());
                m.put("staffNo", e.getEmployeeId());
                m.put("position", e.getPosition() != null ? e.getPosition().getName() : "N/A");
                m.put("department", e.getDepartment() != null ? e.getDepartment().getName() : "N/A");
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(new ApiResponse<>(true, "Eligible evaluatees fetched", result));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Eligible Load Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/evaluator-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEvaluatorInfo() {
        try {
            User user = getCurrentUser();
            Employee e = user.getEmployee();
            if (e == null) throw new RuntimeException("Evaluator employee record missing");
            
            Map<String, Object> info = new java.util.HashMap<>();
            info.put("name", e.getEmployeeName());
            info.put("position", e.getPosition() != null ? e.getPosition().getName() : "N/A");
            info.put("department", e.getDepartment() != null ? e.getDepartment().getName() : "N/A");
            info.put("date", LocalDate.now().toString());
            return ResponseEntity.ok(new ApiResponse<>(true, "Evaluator info fetched", info));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Evaluator Info Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<ApiResponse<List<com.epms.backend.dto.FeedbackDetailDto>>> getDetails(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Details fetched", feedbackService.getFeedbackDetails(id)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Details Error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/time-settings")
    public ResponseEntity<ApiResponse<TimeSettingDto>> getTimeSettings() {
        try {
            return ResponseEntity.ok(new ApiResponse<>(true, "Fetched settings", timeSettingService.getSettings()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Error fetching settings: " + e.getMessage(), null));
        }
    }

    @PostMapping("/time-settings")
    public ResponseEntity<ApiResponse<TimeSettingDto>> saveTimeSettings(@RequestBody TimeSettingDto dto) {
        try {
            if (dto.getYearType() == null || dto.getDuration() == null) {
                return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Required fields cannot be empty", null));
            }
            return ResponseEntity.ok(new ApiResponse<>(true, "Settings saved successfully", timeSettingService.saveSettings(dto)));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Error saving settings: " + e.getMessage(), null));
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
}
