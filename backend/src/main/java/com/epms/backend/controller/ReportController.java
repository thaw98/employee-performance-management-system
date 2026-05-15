package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.entity.User;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.PipReportService;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.dto.pip.report.PipIndividualReportDto;
import com.epms.backend.dto.pip.report.PipProgressReportDto;
import com.epms.backend.dto.pip.report.PipSummaryReportDto;
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
@RequestMapping("/api/reports/pips")
@RequiredArgsConstructor
public class ReportController {

    private final PipReportService pipReportService;
    private final UserRepository userRepository;

    @GetMapping("/{pipId}")
    public ResponseEntity<byte[]> getIndividualPipReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long pipId,
            @RequestParam(defaultValue = "pdf") String format) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        byte[] bytes = pipReportService.generateIndividualPipReport(pipId, format, user);
        return reportResponse(bytes, "pip_" + pipId + "_report", format);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('HR', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<byte[]> getPipSummaryReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "pdf") String format) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        byte[] bytes = pipReportService.generateSummaryReport(status, departmentId, startDate, endDate, format, user);
        return reportResponse(bytes, "pip_summary_report", format);
    }

    @GetMapping("/progress")
    @PreAuthorize("hasAnyRole('HR', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<byte[]> getPipProgressReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            @RequestParam(defaultValue = "pdf") String format) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        byte[] bytes = pipReportService.generateProgressReport(departmentId, startDate, endDate, format, user);
        return reportResponse(bytes, "pip_progress_report", format);
    }

    @GetMapping("/summary/data")
    @PreAuthorize("hasAnyRole('HR', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<PipSummaryReportDto>>> getPipSummaryReportData(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        List<PipSummaryReportDto> data = pipReportService.getPipSummaryReport(status, departmentId, startDate, endDate, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP summary report data retrieved successfully", data));
    }

    @GetMapping("/progress/data")
    @PreAuthorize("hasAnyRole('HR', 'DEPARTMENT_HEAD', 'TEAM_HEAD', 'MANAGER')")
    public ResponseEntity<ApiResponse<PipProgressReportDto>> getPipProgressReportData(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        PipProgressReportDto data = pipReportService.getPipProgressReport(departmentId, startDate, endDate, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP progress report data retrieved successfully", data));
    }

    @GetMapping("/{pipId}/data")
    public ResponseEntity<ApiResponse<PipIndividualReportDto>> getIndividualPipReportData(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long pipId) {
        User user = userRepository.findById(principal.getId()).orElseThrow();
        PipIndividualReportDto data = pipReportService.getIndividualPipReport(pipId, user);
        return ResponseEntity.ok(ApiResponse.ok("PIP individual report data retrieved successfully", data));
    }

    private ResponseEntity<byte[]> reportResponse(byte[] bytes, String basename, String format) {
        boolean excel = "excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format);
        String extension = excel ? "xlsx" : "pdf";
        MediaType mediaType = excel
                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                : MediaType.APPLICATION_PDF;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(mediaType);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(basename + "_" + LocalDate.now() + "." + extension)
                .build());
        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}
