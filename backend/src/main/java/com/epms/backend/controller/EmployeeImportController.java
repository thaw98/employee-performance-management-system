package com.epms.backend.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.EmployeeImportCommitRequestDto;
import com.epms.backend.dto.hr.EmployeeImportCommitResponseDto;
import com.epms.backend.dto.hr.EmployeeImportValidationResponseDto;
import com.epms.backend.entity.EmployeeImportSession;
import com.epms.backend.repository.EmployeeImportSessionRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.EmployeeImportCommitService;
import com.epms.backend.service.EmployeeImportErrorFileService;
import com.epms.backend.service.EmployeeImportTemplateService;
import com.epms.backend.service.EmployeeImportValidationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/employees/import")
@RequiredArgsConstructor
@PreAuthorize("hasRole('HR')")
public class EmployeeImportController {

    private final EmployeeImportTemplateService templateService;
    private final EmployeeImportValidationService validationService;
    private final EmployeeImportCommitService commitService;
    private final EmployeeImportErrorFileService errorFileService;
    private final EmployeeImportSessionRepository sessionRepository;

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try {
            byte[] bytes = templateService.generateTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(
                    ContentDisposition.attachment().filename("employee_import_template.xlsx").build());
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EmployeeImportValidationResponseDto>> validateImport(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            EmployeeImportValidationResponseDto result = validationService.validate(file, principal);
            return ResponseEntity.ok(ApiResponse.ok("Validation complete", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(ApiResponse.fail("Validation failed: " + ex.getMessage()));
        }
    }

    @GetMapping("/error-file/{validationId}")
    public ResponseEntity<byte[]> downloadErrorFile(@PathVariable String validationId) {
        try {
            EmployeeImportSession session = sessionRepository.findByValidationId(validationId)
                    .orElseThrow(() -> new IllegalArgumentException("Session not found"));
            if (session.getErrorFilePath() == null) {
                return ResponseEntity.notFound().build();
            }
            byte[] bytes = errorFileService.readErrorFile(session.getErrorFilePath());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            String filename = "employee_import_errors_" + validationId + ".xlsx";
            headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/commit")
    public ResponseEntity<ApiResponse<EmployeeImportCommitResponseDto>> commitImport(
            @RequestBody EmployeeImportCommitRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            EmployeeImportCommitResponseDto result = commitService.commit(request, principal);
            return ResponseEntity.ok(ApiResponse.ok(result.getMessage(), result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(ApiResponse.fail("Import failed: " + ex.getMessage()));
        }
    }
}
