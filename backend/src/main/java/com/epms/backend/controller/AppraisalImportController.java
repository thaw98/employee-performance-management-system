package com.epms.backend.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.hr.AppraisalImportCommitRequestDto;
import com.epms.backend.dto.hr.AppraisalImportCommitResponseDto;
import com.epms.backend.dto.hr.AppraisalImportValidationResponseDto;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.service.AppraisalImportCommitService;
import com.epms.backend.service.AppraisalImportTemplateService;
import com.epms.backend.service.AppraisalImportValidationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/appraisals/import")
@RequiredArgsConstructor
@PreAuthorize("principal.roleId == 1")
public class AppraisalImportController {

    private final AppraisalImportTemplateService templateService;
    private final AppraisalImportValidationService validationService;
    private final AppraisalImportCommitService commitService;

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try {
            byte[] bytes = templateService.generateTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(
                    ContentDisposition.attachment().filename("appraisal_import_template.xlsx").build());
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AppraisalImportValidationResponseDto>> validateImport(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            AppraisalImportValidationResponseDto result = validationService.validate(file, principal);
            return ResponseEntity.ok(ApiResponse.ok("Validation complete", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(ApiResponse.fail("Validation failed: " + ex.getMessage()));
        }
    }

    @PostMapping("/commit")
    public ResponseEntity<ApiResponse<AppraisalImportCommitResponseDto>> commitImport(
            @RequestBody AppraisalImportCommitRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            AppraisalImportCommitResponseDto result = commitService.commit(request, principal);
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
