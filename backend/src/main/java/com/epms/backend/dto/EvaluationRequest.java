package com.epms.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class EvaluationRequest {
    private List<AnswerRequest> answers;
    private String comments;
    private String signature;

    @Data
    public static class AnswerRequest {
        private Long questionId;
        private Double rating;
        private String comments;
    }
}
