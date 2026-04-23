package com.epms.backend.dto.hr;

import java.util.List;
import java.util.Map;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmployeeImportRowErrorDto {
    private Integer rowNumber;
    private Map<String, Object> rowData;
    private List<String> errors;
}
