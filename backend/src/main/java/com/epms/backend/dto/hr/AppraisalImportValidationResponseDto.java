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
public class AppraisalImportValidationResponseDto {
    private String validationId;
    private String fileName;
    private Integer totalRows;
    private Integer validRows;
    private Integer invalidRows;
    private List<Map<String, Object>> validItems;
    private List<AppraisalImportRowErrorDto> invalidItems;
    private Boolean errorFileAvailable;
    private String errorFileDownloadUrl;
}
