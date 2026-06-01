package com.epms.backend.dto.hr;

import java.time.LocalDate;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AppraisalImportCommitRequestDto {
    private String validationId;
    private String templateName;
    private LocalDate assessmentDate;
    private LocalDate effectiveDate;
    private LocalDate deadlineDate;
    private Long reviewCycleId;
    private Integer maxRating;
    private List<Long> positionIds;
    private List<AppraisalImportEditedRowDto> editedRows;
}
