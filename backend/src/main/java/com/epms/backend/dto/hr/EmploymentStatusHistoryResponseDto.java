package com.epms.backend.dto.hr;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmploymentStatusHistoryResponseDto {
    private Long id;
    private Long employeeId;
    private String previousStatus;
    private String newStatus;
    private LocalDate effectiveDate;
    private Long changedByUserId;
    private LocalDateTime changedAt;
    private String reason;
}
