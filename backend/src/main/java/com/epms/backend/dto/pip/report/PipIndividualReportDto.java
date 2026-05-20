package com.epms.backend.dto.pip.report;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PipIndividualReportDto {
    private Long pipId;
    private String employeeStaffNo;
    private String employeeName;
    private String employeeDepartment;
    private String employeePosition;
    private String managerName;
    private String managerDepartment;
    private BigDecimal kpiScore;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate originalEndDate;
    private LocalDate actualEndDate;
    private Integer totalHours;
    private Integer completedHours;
    private BigDecimal overallProgress;
    private String reasonForPlan;
    private String expectedImprovements;
    private String finalOutcome;
    private String closingRemarks;
    private LocalDateTime employeeSignatureDate;
    private LocalDateTime managerSignatureDate;
    private String employeeSignature;
    private String managerSignature;
    private String objectivesSummary;
    private String meetingsSummary;
    private String progressUpdatesSummary;
    private List<ObjectiveRow> objectives;
    private List<MeetingRow> meetings;
    private List<ProgressUpdateRow> progressUpdates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ObjectiveRow {
        private Long objectiveId;
        private String description;
        private BigDecimal weightPercentage;
        private Integer progressPercentage;
        private LocalDate dueDate;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MeetingRow {
        private Long meetingId;
        private LocalDate scheduledDate;
        private LocalDateTime meetingTime;
        private String status;
        private String notes;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProgressUpdateRow {
        private Long updateId;
        private LocalDate updateDate;
        private String objectiveDescription;
        private Integer previousPercentage;
        private Integer newPercentage;
        private String feedback;
        private String updatedBy;
        private Instant createdDate;
        private Integer completedHours;
    }
}
