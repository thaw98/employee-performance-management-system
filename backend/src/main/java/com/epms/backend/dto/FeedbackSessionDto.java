package com.epms.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class FeedbackSessionDto {
    private FeedbackTargetDto evaluator;
    private List<FeedbackTargetDto> targets;
}
