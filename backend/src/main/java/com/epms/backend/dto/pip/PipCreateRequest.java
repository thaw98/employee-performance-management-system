package com.epms.backend.dto.pip;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class PipCreateRequest {
    private String employeeId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalHours;
    private List<String> objectives;
}
