package com.epms.backend.dto.pip;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class PipCreateRequest {
    /** {@link com.epms.backend.entity.Employee} primary key (same as {@code users.employee_id} FK). */
    private Long employeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalHours;
    private List<String> objectives;
}
