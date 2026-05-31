package com.epms.backend.entity;

import java.util.List;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

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

    @Test
    void defaultIfNull_returnsFivePointForNull() {
        assertEquals(SelfAssessmentRatingSystem.FIVE_POINT, SelfAssessmentRatingSystem.defaultIfNull(null));
    }

    @Test
    void defaultIfNull_returnsSameForNonNull() {
        assertEquals(SelfAssessmentRatingSystem.TEN_POINT, SelfAssessmentRatingSystem.defaultIfNull(SelfAssessmentRatingSystem.TEN_POINT));
        assertEquals(SelfAssessmentRatingSystem.TWO_POINT, SelfAssessmentRatingSystem.defaultIfNull(SelfAssessmentRatingSystem.TWO_POINT));
    }

    @Test
    void getMaxRating_returnsCorrectValues() {
        assertEquals(2, SelfAssessmentRatingSystem.TWO_POINT.getMaxRating());
        assertEquals(3, SelfAssessmentRatingSystem.THREE_POINT.getMaxRating());
        assertEquals(4, SelfAssessmentRatingSystem.FOUR_POINT.getMaxRating());
        assertEquals(5, SelfAssessmentRatingSystem.FIVE_POINT.getMaxRating());
        assertEquals(6, SelfAssessmentRatingSystem.SIX_POINT.getMaxRating());
        assertEquals(7, SelfAssessmentRatingSystem.SEVEN_POINT.getMaxRating());
        assertEquals(10, SelfAssessmentRatingSystem.TEN_POINT.getMaxRating());
    }

    @Test
    void getDefaultYesMinRating_returnsCorrectValues() {
        assertEquals(2, SelfAssessmentRatingSystem.TWO_POINT.getDefaultYesMinRating());
        assertEquals(2, SelfAssessmentRatingSystem.THREE_POINT.getDefaultYesMinRating());
        assertEquals(3, SelfAssessmentRatingSystem.FOUR_POINT.getDefaultYesMinRating());
        assertEquals(3, SelfAssessmentRatingSystem.FIVE_POINT.getDefaultYesMinRating());
        assertEquals(4, SelfAssessmentRatingSystem.SIX_POINT.getDefaultYesMinRating());
        assertEquals(4, SelfAssessmentRatingSystem.SEVEN_POINT.getDefaultYesMinRating());
        assertEquals(5, SelfAssessmentRatingSystem.TEN_POINT.getDefaultYesMinRating());
    }

    @Test
    void getYesRatings_returnsCorrectRange() {
        // FIVE_POINT with yesMinRating=3 -> [5,4,3]
        assertEquals(List.of(5, 4, 3), SelfAssessmentRatingSystem.FIVE_POINT.getYesRatings(3));
        // FIVE_POINT with yesMinRating=2 -> [5,4,3,2]
        assertEquals(List.of(5, 4, 3, 2), SelfAssessmentRatingSystem.FIVE_POINT.getYesRatings(2));
        // TEN_POINT with yesMinRating=5 -> [10,9,8,7,6,5]
        assertEquals(List.of(10, 9, 8, 7, 6, 5), SelfAssessmentRatingSystem.TEN_POINT.getYesRatings(5));
        // TWO_POINT with yesMinRating=2 -> [2]
        assertEquals(List.of(2), SelfAssessmentRatingSystem.TWO_POINT.getYesRatings(2));
        // THREE_POINT with yesMinRating=2 -> [3,2]
        assertEquals(List.of(3, 2), SelfAssessmentRatingSystem.THREE_POINT.getYesRatings(2));
    }

    @Test
    void getNoRatings_returnsCorrectRange() {
        // FIVE_POINT with yesMinRating=3 -> [2,1]
        assertEquals(List.of(2, 1), SelfAssessmentRatingSystem.FIVE_POINT.getNoRatings(3));
        // TEN_POINT with yesMinRating=5 -> [4,3,2,1]
        assertEquals(List.of(4, 3, 2, 1), SelfAssessmentRatingSystem.TEN_POINT.getNoRatings(5));
        // TWO_POINT with yesMinRating=2 -> [1]
        assertEquals(List.of(1), SelfAssessmentRatingSystem.TWO_POINT.getNoRatings(2));
    }

    @Test
    void isValidRating_validatesCorrectly() {
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating("Yes", 5, 3));
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating("Yes", 3, 3));
        assertFalse(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating("Yes", 2, 3));
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating("No", 2, 3));
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating("No", 1, 3));
        assertFalse(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating("No", 5, 3));
        // null answer/rating is always valid
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating(null, 5, 3));
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidRating("Yes", null, 3));
    }

    @Test
    void isValidYesNo_acceptsValidValues() {
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidYesNo("Yes"));
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidYesNo("No"));
        assertTrue(SelfAssessmentRatingSystem.FIVE_POINT.isValidYesNo(null));
        assertFalse(SelfAssessmentRatingSystem.FIVE_POINT.isValidYesNo("Maybe"));
    }

    @Test
    void normalizeYesMinRating_clampsCorrectly() {
        assertEquals(2, SelfAssessmentRatingSystem.normalizeYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, 0));
        assertEquals(5, SelfAssessmentRatingSystem.normalizeYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, 10));
        assertEquals(3, SelfAssessmentRatingSystem.normalizeYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, 3));
        assertEquals(2, SelfAssessmentRatingSystem.normalizeYesMinRating(SelfAssessmentRatingSystem.TWO_POINT, 1));
        assertEquals(2, SelfAssessmentRatingSystem.normalizeYesMinRating(SelfAssessmentRatingSystem.TWO_POINT, 5));
        assertEquals(3, SelfAssessmentRatingSystem.normalizeYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, null));
        assertEquals(2, SelfAssessmentRatingSystem.normalizeYesMinRating(SelfAssessmentRatingSystem.TWO_POINT, null));
    }

    @Test
    void validateYesMinRating_validatesCorrectly() {
        SelfAssessmentRatingSystem.validateYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, 3);
        assertThrows(RuntimeException.class, () -> SelfAssessmentRatingSystem.validateYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, 1));
        assertThrows(RuntimeException.class, () -> SelfAssessmentRatingSystem.validateYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, 6));
        SelfAssessmentRatingSystem.validateYesMinRating(SelfAssessmentRatingSystem.FIVE_POINT, null);
        SelfAssessmentRatingSystem.validateYesMinRating(SelfAssessmentRatingSystem.TWO_POINT, 2);
        assertThrows(RuntimeException.class, () -> SelfAssessmentRatingSystem.validateYesMinRating(SelfAssessmentRatingSystem.TWO_POINT, 3));
    }

    @Test
    void normalizeYesMinRating_fallbackWorksForAllScales() {
        // Instance method normalizeYesMinRating
        assertEquals(2, SelfAssessmentRatingSystem.TWO_POINT.normalizeYesMinRating(null));
        assertEquals(2, SelfAssessmentRatingSystem.THREE_POINT.normalizeYesMinRating(null));
        assertEquals(3, SelfAssessmentRatingSystem.FOUR_POINT.normalizeYesMinRating(null));
        assertEquals(3, SelfAssessmentRatingSystem.FIVE_POINT.normalizeYesMinRating(null));
        assertEquals(4, SelfAssessmentRatingSystem.SIX_POINT.normalizeYesMinRating(null));
        assertEquals(4, SelfAssessmentRatingSystem.SEVEN_POINT.normalizeYesMinRating(null));
        assertEquals(5, SelfAssessmentRatingSystem.TEN_POINT.normalizeYesMinRating(null));
    }

}
