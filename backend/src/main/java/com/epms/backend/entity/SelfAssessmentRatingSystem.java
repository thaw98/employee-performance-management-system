package com.epms.backend.entity;

import java.util.List;

public enum SelfAssessmentRatingSystem {
    FIVE_POINT(5, List.of(5, 4, 3), List.of(2, 1)),
    TEN_POINT(10, List.of(10, 9, 8, 7, 6, 5), List.of(4, 3, 2, 1));

    private final int maxRating;
    private final List<Integer> yesRatings;
    private final List<Integer> noRatings;

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

    public boolean isValidRating(String yesNoAnswer, Integer rating) {
        if (yesNoAnswer == null || rating == null) {
            return true;
        }
        return switch (yesNoAnswer.trim()) {
            case "Yes" -> yesRatings.contains(rating);
            case "No" -> noRatings.contains(rating);
            default -> false;
        };
    }

    public boolean isValidYesNo(String yesNoAnswer) {
        return yesNoAnswer == null || "Yes".equals(yesNoAnswer.trim()) || "No".equals(yesNoAnswer.trim());
    }

    public static SelfAssessmentRatingSystem defaultIfNull(SelfAssessmentRatingSystem ratingSystem) {
        return ratingSystem == null ? FIVE_POINT : ratingSystem;
    }
}
