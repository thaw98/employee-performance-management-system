package com.epms.backend.dto.scoreformula;

public record UpdateScoreFormulaRequest(
        String name,
        String definition,
        String description
) {}
