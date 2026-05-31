package com.epms.backend.dto.scoreformula;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateScoreFormulaRequest(
        @NotBlank String name,
        @NotBlank String area,
        @NotBlank String definition,
        String description
) {}
