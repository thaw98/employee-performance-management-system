package com.epms.backend.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SelfAssessmentRatingSystemTest {

    @Test
    void normalizeFivePointYesMinRating_clampsOutOfRangeValues() {
        assertEquals(2, SelfAssessmentRatingSystem.normalizeFivePointYesMinRating(0));
        assertEquals(2, SelfAssessmentRatingSystem.normalizeFivePointYesMinRating(1));
        assertEquals(5, SelfAssessmentRatingSystem.normalizeFivePointYesMinRating(9));
        assertEquals(3, SelfAssessmentRatingSystem.normalizeFivePointYesMinRating(null));
    }

    @Test
    void validateFivePointYesMinRating_rejectsOutOfRangeInput() {
        assertThrows(RuntimeException.class, () -> SelfAssessmentRatingSystem.validateFivePointYesMinRating(1));
        assertThrows(RuntimeException.class, () -> SelfAssessmentRatingSystem.validateFivePointYesMinRating(6));
    }

    @Test
    void validateFivePointYesMinRating_allowsNull() {
        SelfAssessmentRatingSystem.validateFivePointYesMinRating(null);
    }
}
