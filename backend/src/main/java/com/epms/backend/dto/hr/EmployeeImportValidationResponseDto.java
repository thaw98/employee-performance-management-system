package com.epms.backend.dto.hr;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeImportValidationResponseDto {
    private String validationId;
    private String fileName;
    private Integer totalRows;
    private Integer validRows;
    private Integer invalidRows;
    private List<Map<String, Object>> validItems;
    private List<EmployeeImportRowErrorDto> invalidItems;
    private Boolean errorFileAvailable;
    private String errorFileDownloadUrl;
}
