package com.epms.backend.entity;

import java.util.List;
import java.util.stream.IntStream;

public enum SelfAssessmentRatingSystem {
    FIVE_POINT(5),
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
        int threshold = switch (this) {
            case FIVE_POINT -> normalizeFivePointYesMinRating(yesMinRating);
            case TEN_POINT -> normalizeTenPointYesMinRating(yesMinRating);
        };
        return IntStream.iterate(maxRating, n -> n >= threshold, n -> n - 1)
                .boxed()
                .toList();
    }

    public List<Integer> getNoRatings(Integer yesMinRating) {
        int threshold = switch (this) {
            case FIVE_POINT -> normalizeFivePointYesMinRating(yesMinRating);
            case TEN_POINT -> normalizeTenPointYesMinRating(yesMinRating);
        };
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
        return value;
    }

    public static void validateFivePointYesMinRating(Integer value) {
        int threshold = normalizeFivePointYesMinRating(value);
        if (threshold < MIN_FIVE_POINT_YES_MIN_RATING || threshold > MAX_FIVE_POINT_YES_MIN_RATING) {
            throw new RuntimeException("Five-point Yes minimum rating must be between 2 and 5");
        }
    }

    public static int normalizeTenPointYesMinRating(Integer value) {
        if (value == null) {
            return DEFAULT_TEN_POINT_YES_MIN_RATING;
        }
        return value;
    }

    public static void validateTenPointYesMinRating(Integer value) {
        int threshold = normalizeTenPointYesMinRating(value);
        if (threshold < MIN_TEN_POINT_YES_MIN_RATING || threshold > MAX_TEN_POINT_YES_MIN_RATING) {
            throw new RuntimeException("Ten-point Yes minimum rating must be between 2 and 10");
        }
    }
}
