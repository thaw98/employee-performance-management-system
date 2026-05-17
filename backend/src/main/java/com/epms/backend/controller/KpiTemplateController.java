package com.epms.backend.controller;

import com.epms.backend.dto.KpiTemplateDto;
import com.epms.backend.service.KpiTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/kpi-templates")
@RequiredArgsConstructor
@CrossOrigin
public class KpiTemplateController {

    private final KpiTemplateService templateService;

    @GetMapping
    public ResponseEntity<List<KpiTemplateDto>> getTemplates(
            @RequestParam String type,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long positionId) {
        return ResponseEntity.ok(templateService.getTemplates(type, departmentId, positionId));
    }

    @PostMapping
    public ResponseEntity<KpiTemplateDto> createTemplate(@RequestBody KpiTemplateDto dto) {
        return ResponseEntity.ok(templateService.createTemplate(dto));
    }
}
