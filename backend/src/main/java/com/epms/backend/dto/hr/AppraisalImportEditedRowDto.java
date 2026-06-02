package com.epms.backend.dto.hr;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AppraisalImportEditedRowDto {
    private Integer rowNumber;
    private String categoryName;
    private String categoryDescription;
    private String questionText;
}
