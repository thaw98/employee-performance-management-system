package com.epms.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import com.epms.backend.entity.Gender;

class PersonNameNormalizerTest {

    @Test
    void normalizeEmployeeName_addsMaleTitle() {
        assertEquals("U Zaw Aung", PersonNameNormalizer.normalizeEmployeeName("zaw  aung", Gender.Male));
    }

    @Test
    void normalizeEmployeeName_addsFemaleTitle() {
        assertEquals("Daw Thu Zar", PersonNameNormalizer.normalizeEmployeeName("thu zar", Gender.Female));
    }

    @Test
    void normalizeEmployeeName_preservesExistingMaleTitle() {
        assertEquals("U Zaw Aung", PersonNameNormalizer.normalizeEmployeeName("U Zaw Aung", Gender.Male));
    }

    @Test
    void normalizeEmployeeName_preservesExistingFemaleTitle() {
        assertEquals("Daw Thu Zar", PersonNameNormalizer.normalizeEmployeeName("Daw Thu Zar", Gender.Female));
    }

    @Test
    void normalizeEmployeeName_preservesConflictingTitle() {
        assertEquals("Daw Thu Zar", PersonNameNormalizer.normalizeEmployeeName("Daw Thu Zar", Gender.Male));
    }
}
