package com.epms.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class FeedbackSubmissionRequest {
    private Long evaluateeId;
    private String role;
    private Boolean anonymous;
    private String additionalComments;
    private List<FeedbackDetailRequest> details;

    @Data
    public static class FeedbackDetailRequest {
        private Long criteriaId;
        private Integer rating;
        private String comment;
    }
}
