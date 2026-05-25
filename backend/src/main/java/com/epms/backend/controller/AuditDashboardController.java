package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.AuditLogDto;
import com.epms.backend.service.AuditService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("principal.roleId == 1 or principal.roleId == 5")
public class AuditDashboardController {

    private final AuditService auditService;

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Page<AuditDashboardLogDto>>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String targetType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Long userId) {

        List<AuditDashboardLogDto> rows = auditService.getAllAuditLogs().stream()
                .filter(log -> matches(actionType, log.getActionType()))
                .filter(log -> matches(targetType, log.getTargetType()))
                .filter(log -> userId == null || Objects.equals(userId, log.getPerformedByUserId()))
                .filter(log -> isWithinDateRange(log.getCreatedAt(), startDate, endDate))
                .sorted(Comparator.comparing(AuditLogDto::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDashboardLog)
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int start = Math.min(safePage * safeSize, rows.size());
        int end = Math.min(start + safeSize, rows.size());
        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<AuditDashboardLogDto> result = new PageImpl<>(rows.subList(start, end), pageable, rows.size());

        return ResponseEntity.ok(ApiResponse.ok("Fetched audit logs", result));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AuditSummaryDto>> getSummary() {
        List<AuditLogDto> logs = auditService.getAllAuditLogs();
        Instant todayStart = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();

        long todayAudits = logs.stream()
                .map(AuditLogDto::getCreatedAt)
                .filter(Objects::nonNull)
                .filter(createdAt -> !createdAt.isBefore(todayStart))
                .count();

        long uniqueUsers = logs.stream()
                .map(AuditLogDto::getPerformedByUserId)
                .filter(Objects::nonNull)
                .distinct()
                .count();

        String mostActiveAction = logs.stream()
                .map(AuditLogDto::getActionType)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        AuditSummaryDto summary = new AuditSummaryDto(logs.size(), todayAudits, uniqueUsers, mostActiveAction);
        return ResponseEntity.ok(ApiResponse.ok("Fetched audit summary", summary));
    }

    private boolean matches(String filterValue, String actualValue) {
        if (filterValue == null || filterValue.isBlank()) {
            return true;
        }
        return actualValue != null && actualValue.toLowerCase().contains(filterValue.trim().toLowerCase());
    }

    private boolean isWithinDateRange(Instant createdAt, String startDate, String endDate) {
        if (createdAt == null) {
            return false;
        }
        ZoneId zone = ZoneId.systemDefault();
        if (startDate != null && !startDate.isBlank()) {
            Instant start = LocalDate.parse(startDate).atStartOfDay(zone).toInstant();
            if (createdAt.isBefore(start)) {
                return false;
            }
        }
        if (endDate != null && !endDate.isBlank()) {
            Instant end = LocalDate.parse(endDate).plusDays(1).atStartOfDay(zone).toInstant();
            if (!createdAt.isBefore(end)) {
                return false;
            }
        }
        return true;
    }

    private AuditDashboardLogDto toDashboardLog(AuditLogDto log) {
        return new AuditDashboardLogDto(
                log.getId(),
                log.getActionType(),
                log.getTargetType(),
                log.getTargetId(),
                log.getPerformedByUserId(),
                log.getPerformedByUserName(),
                log.getDescription(),
                log.getMetadataJson(),
                log.getBeforeData(),
                log.getAfterData(),
                log.getCreatedAt());
    }

    @Data
    @AllArgsConstructor
    public static class AuditDashboardLogDto {
        private Long auditId;
        private String actionType;
        private String targetType;
        private Long targetId;
        private Long performedByUserId;
        private String performedByUserName;
        private String description;
        private String metadataJson;
        private String beforeData;
        private String afterData;
        private Instant createdAt;
    }

    @Data
    @AllArgsConstructor
    public static class AuditSummaryDto {
        private long totalAudits;
        private long todayAudits;
        private long uniqueUsers;
        private String mostActiveAction;
    }
}
