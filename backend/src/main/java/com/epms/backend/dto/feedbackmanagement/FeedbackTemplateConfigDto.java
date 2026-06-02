package com.epms.backend.dto.feedbackmanagement;

import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
public class FeedbackTemplateConfigDto {
    private Long id;
    private String templateName;
    private String targetType;
    private Long targetId;
    private String targetName;
    private Long reviewCycleId;
    private String reviewCycleName;
    private List<Long> questionIds = new ArrayList<>();
    private List<AudienceRuleDto> audienceRules;
    private String status;
    private Integer maxRating = 5;
    private Instant createdDate;
    private Instant updatedDate;
    private List<String> activeRoles = List.of("SELF", "PEER", "MANAGER", "SUBORDINATE");
    private Map<String, List<Long>> questionsByRole;

    @Data
    public static class AudienceRuleDto {
        private Long departmentId;
        private String departmentName;
        private Long positionId;
        private String positionName;
    }
}
