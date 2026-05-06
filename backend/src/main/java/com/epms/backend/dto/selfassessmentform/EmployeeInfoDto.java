package com.epms.backend.dto.selfassessmentform;

public record EmployeeInfoDto(
        Long id,
        String employeeId,
        String employeeName,
        String email,
        Long departmentId,
        String departmentName,
        String departmentCode,
        Long positionId,
        String positionName,
        String positionCode
) {}
