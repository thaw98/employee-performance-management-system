package com.epms.backend.util;

/**
 * Normalizes Myanmar NRC numbers for storage and comparison.
 * <p>
 * Normalization rules:
 * <ul>
 *   <li>Trim leading and trailing whitespace</li>
 *   <li>Remove all internal whitespace</li>
 *   <li>Convert all letters to uppercase</li>
 * </ul>
 * <p>
 * Examples:
 * <ul>
 *   <li>{@code " 7/nyalapa(n)123456 "} → {@code "7/NYALAPA(N)123456"}</li>
 *   <li>{@code "7/ PAKHANA (N) 123456"} → {@code "7/PAKHANA(N)123456"}</li>
 * </ul>
 */
public final class NrcNormalizer {

    private NrcNormalizer() {
    }

    /**
     * Normalizes an NRC number according to the business rules.
     *
     * @param raw the raw NRC string, may be null or empty
     * @return the normalized NRC string, or null if input is null or empty after trimming
     */
    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        
        return trimmed.replaceAll("\\s+", "").toUpperCase();
    }
}
