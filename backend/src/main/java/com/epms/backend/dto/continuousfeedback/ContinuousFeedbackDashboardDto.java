package com.epms.backend.dto.continuousfeedback;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousFeedbackDashboardDto {
    private long totalFeedbackRecords;
    private Map<String, Long> feedbackByCategory;
    private long openActionItems;
    private long overdueActionItems;
    private long pipWarningCases;
    private List<ContinuousFeedbackDto> recentFeedback;
    private List<ContinuousFeedbackActionItemDto> overdueItems;
}
