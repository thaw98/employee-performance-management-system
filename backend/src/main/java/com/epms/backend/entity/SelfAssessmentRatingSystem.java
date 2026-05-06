package com.epms.backend.entity;

import java.util.List;
import java.util.stream.IntStream;

public enum SelfAssessmentRatingSystem {
    FIVE_POINT(5, List.of(5, 4, 3), List.of(2, 1)),
    TEN_POINT(10, List.of(10, 9, 8, 7, 6, 5), List.of(4, 3, 2, 1));

    private final int maxRating;
    private final List<Integer> yesRatings;
    private final List<Integer> noRatings;
    public static final int DEFAULT_TEN_POINT_YES_MIN_RATING = 5;
    public static final int MIN_TEN_POINT_YES_MIN_RATING = 2;
    public static final int MAX_TEN_POINT_YES_MIN_RATING = 10;

    SelfAssessmentRatingSystem(int maxRating, List<Integer> yesRatings, List<Integer> noRatings) {
        this.maxRating = maxRating;
        this.yesRatings = yesRatings;
        this.noRatings = noRatings;
    }

    public int getMaxRating() {
        return maxRating;
    }

    public List<Integer> getYesRatings() {
        return yesRatings;
    }

    public List<Integer> getNoRatings() {
        return noRatings;
    }

    public List<Integer> getYesRatings(Integer tenPointYesMinRating) {
        if (this != TEN_POINT) {
            return yesRatings;
        }
        int threshold = normalizeTenPointYesMinRating(tenPointYesMinRating);
        return IntStream.iterate(maxRating, n -> n >= threshold, n -> n - 1)
                .boxed()
                .toList();
    }

    public List<Integer> getNoRatings(Integer tenPointYesMinRating) {
        if (this != TEN_POINT) {
            return noRatings;
        }
        int threshold = normalizeTenPointYesMinRating(tenPointYesMinRating);
        return IntStream.iterate(threshold - 1, n -> n >= 1, n -> n - 1)
                .boxed()
                .toList();
    }

    public boolean isValidRating(String yesNoAnswer, Integer rating) {
        return isValidRating(yesNoAnswer, rating, DEFAULT_TEN_POINT_YES_MIN_RATING);
    }

    public boolean isValidRating(String yesNoAnswer, Integer rating, Integer tenPointYesMinRating) {
        if (yesNoAnswer == null || rating == null) {
            return true;
        }
        return switch (yesNoAnswer.trim()) {
            case "Yes" -> getYesRatings(tenPointYesMinRating).contains(rating);
            case "No" -> getNoRatings(tenPointYesMinRating).contains(rating);
            default -> false;
        };
    }

    public boolean isValidYesNo(String yesNoAnswer) {
        return yesNoAnswer == null || "Yes".equals(yesNoAnswer.trim()) || "No".equals(yesNoAnswer.trim());
    }

    public static SelfAssessmentRatingSystem defaultIfNull(SelfAssessmentRatingSystem ratingSystem) {
        return ratingSystem == null ? FIVE_POINT : ratingSystem;
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
