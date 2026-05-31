package com.epms.backend.entity;

import java.util.List;
import java.util.stream.IntStream;

public enum SelfAssessmentRatingSystem {
    TWO_POINT(2),
    THREE_POINT(3),
    FOUR_POINT(4),
    FIVE_POINT(5),
    SIX_POINT(6),
    SEVEN_POINT(7),
    TEN_POINT(10);

    private final int maxRating;

    public static final int DEFAULT_FIVE_POINT_YES_MIN_RATING = 3;
    public static final int MIN_FIVE_POINT_YES_MIN_RATING = 2;
    public static final int MAX_FIVE_POINT_YES_MIN_RATING = 5;
    public static final int DEFAULT_TEN_POINT_YES_MIN_RATING = 5;
    public static final int MIN_TEN_POINT_YES_MIN_RATING = 2;
    public static final int MAX_TEN_POINT_YES_MIN_RATING = 10;

    SelfAssessmentRatingSystem(int maxRating) {
        this.maxRating = maxRating;
    }

    public int getMaxRating() {
        return maxRating;
    }

    public List<Integer> getYesRatings(Integer yesMinRating) {
        int threshold = normalizeYesMinRating(yesMinRating);
        return IntStream.iterate(maxRating, n -> n >= threshold, n -> n - 1)
                .boxed()
                .toList();
    }

    public List<Integer> getNoRatings(Integer yesMinRating) {
        int threshold = normalizeYesMinRating(yesMinRating);
        return IntStream.iterate(threshold - 1, n -> n >= 1, n -> n - 1)
                .boxed()
                .toList();
    }

    public boolean isValidRating(String yesNoAnswer, Integer rating, Integer yesMinRating) {
        if (yesNoAnswer == null || rating == null) {
            return true;
        }
        return switch (yesNoAnswer.trim()) {
            case "Yes" -> getYesRatings(yesMinRating).contains(rating);
            case "No" -> getNoRatings(yesMinRating).contains(rating);
            default -> false;
        };
    }

    public boolean isValidYesNo(String yesNoAnswer) {
        return yesNoAnswer == null || "Yes".equals(yesNoAnswer.trim()) || "No".equals(yesNoAnswer.trim());
    }

    public static SelfAssessmentRatingSystem defaultIfNull(SelfAssessmentRatingSystem ratingSystem) {
        return ratingSystem == null ? FIVE_POINT : ratingSystem;
    }

    public static int normalizeFivePointYesMinRating(Integer value) {
        if (value == null) {
            return DEFAULT_FIVE_POINT_YES_MIN_RATING;
        }
        return Math.min(MAX_FIVE_POINT_YES_MIN_RATING, Math.max(MIN_FIVE_POINT_YES_MIN_RATING, value));
    }

    public static void validateFivePointYesMinRating(Integer value) {
        if (value == null) {
            return;
        }
        if (value < MIN_FIVE_POINT_YES_MIN_RATING || value > MAX_FIVE_POINT_YES_MIN_RATING) {
            throw new RuntimeException("Five-point Yes minimum rating must be between 2 and 5");
        }
    }

    public static int normalizeTenPointYesMinRating(Integer value) {
        if (value == null) {
            return DEFAULT_TEN_POINT_YES_MIN_RATING;
        }
        return Math.min(MAX_TEN_POINT_YES_MIN_RATING, Math.max(MIN_TEN_POINT_YES_MIN_RATING, value));
    }

    public static void validateTenPointYesMinRating(Integer value) {
        if (value == null) {
            return;
        }
        if (value < MIN_TEN_POINT_YES_MIN_RATING || value > MAX_TEN_POINT_YES_MIN_RATING) {
            throw new RuntimeException("Ten-point Yes minimum rating must be between 2 and 10");
        }
    }

    public int getDefaultYesMinRating() {
        return switch (this) {
            case TWO_POINT -> 2;
            case THREE_POINT -> 2;
            case FOUR_POINT -> 3;
            case FIVE_POINT -> DEFAULT_FIVE_POINT_YES_MIN_RATING;
            case SIX_POINT -> 4;
            case SEVEN_POINT -> 4;
            case TEN_POINT -> DEFAULT_TEN_POINT_YES_MIN_RATING;
        };
    }

    public static int normalizeYesMinRating(SelfAssessmentRatingSystem system, Integer value) {
        if (value == null) {
            return system.getDefaultYesMinRating();
        }
        int min = 2;
        int max = system.getMaxRating();
        return Math.min(max, Math.max(min, value));
    }

    public int normalizeYesMinRating(Integer value) {
        if (value == null) {
            return getDefaultYesMinRating();
        }
        int min = 2;
        return Math.min(maxRating, Math.max(min, value));
    }

    public static void validateYesMinRating(SelfAssessmentRatingSystem system, Integer value) {
        if (value == null) {
            return;
        }
        int min = 2;
        int max = system.getMaxRating();
        if (value < min || value > max) {
            throw new RuntimeException("Yes minimum rating for " + system.name() + " must be between " + min + " and " + max);
        }
    }
}
