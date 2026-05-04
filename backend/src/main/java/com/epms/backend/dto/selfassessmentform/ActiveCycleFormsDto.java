package com.epms.backend.dto.selfassessmentform;

import java.util.List;

public record ActiveCycleFormsDto(
        CycleInfoDto activeCycle,
        List<FormListDto> forms
) {
}
