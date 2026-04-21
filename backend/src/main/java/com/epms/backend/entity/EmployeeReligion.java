package com.epms.backend.entity;

public enum EmployeeReligion {
    Buddhist,
    Christian,
    Muslim,
    Hindu;

    /**
     * Canonical label for API responses (matches MySQL {@code ENUM} literals).
     */
    public String toApiLabel() {
        return switch (this) {
            case Buddhist -> "Buddhist";
            case Christian -> "Christian";
            case Muslim -> "Muslim";
            case Hindu -> "Hindu";
        };
    }

    public static EmployeeReligion fromValue(String value) {
        if (value == null) {
            return null;
        }
        for (EmployeeReligion religion : values()) {
            if (religion.toApiLabel().equalsIgnoreCase(value.trim())) {
                return religion;
            }
        }
        throw new IllegalArgumentException("Religion must be one of: Buddhist, Christian, Muslim, Hindu");
    }
}
