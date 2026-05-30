package com.epms.backend.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.selfassessmentform.SelfAssessmentTemplateImportValidationResponseDto;
import com.epms.backend.service.SelfAssessmentTemplateImportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/self-assessment-forms/templates/import")
@RequiredArgsConstructor
@CrossOrigin
@PreAuthorize("principal.roleId == 1")
public class SelfAssessmentTemplateImportController {

    private final SelfAssessmentTemplateImportService importService;

    @GetMapping("/template")
    public ResponseEntity<byte[]> downloadTemplate() {
        try {
            byte[] bytes = importService.generateTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDisposition(
                    ContentDisposition.attachment().filename("self_assessment_template_import_template.xlsx").build());
            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/validate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<SelfAssessmentTemplateImportValidationResponseDto>> validateImport(
            @RequestPart("file") MultipartFile file) {
        try {
            SelfAssessmentTemplateImportValidationResponseDto result = importService.validate(file);
            return ResponseEntity.ok(ApiResponse.ok("Validation complete", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(ApiResponse.fail("Validation failed: " + ex.getMessage()));
        }
    }
}
