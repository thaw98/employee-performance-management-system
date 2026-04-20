package com.epms.backend.dto.pip;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EligibleEmployeeDTO {
    private Long employeeRecordId;
    private String employeeId;
    private String employeeName;
    private String departmentName;
    private BigDecimal totalScore;
}
