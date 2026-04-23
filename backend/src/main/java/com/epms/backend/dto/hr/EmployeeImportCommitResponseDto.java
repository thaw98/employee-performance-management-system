package com.epms.backend.dto.hr;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeImportCommitResponseDto {
    private Boolean success;
    private String message;
    private Integer importedCount;
    private Integer failedCount;
    private Long auditId;
}
