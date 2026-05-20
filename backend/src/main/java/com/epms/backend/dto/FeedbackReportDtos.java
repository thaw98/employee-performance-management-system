package com.epms.backend.dto;

import java.util.List;

public class FeedbackReportDtos {

    public static class ReportDepartmentDto {
        private Long departmentId;
        private String departmentName;

        public ReportDepartmentDto() {}

        public ReportDepartmentDto(Long departmentId, String departmentName) {
            this.departmentId = departmentId;
            this.departmentName = departmentName;
        }

        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
    }

    public static class CriteriaAverageDto {
        private Long criteriaId;
        private String criteriaName;
        private Double average;

        public CriteriaAverageDto() {}

        public CriteriaAverageDto(Long criteriaId, String criteriaName, Double average) {
            this.criteriaId = criteriaId;
            this.criteriaName = criteriaName;
            this.average = average;
        }

        public Long getCriteriaId() { return criteriaId; }
        public void setCriteriaId(Long criteriaId) { this.criteriaId = criteriaId; }
        public String getCriteriaName() { return criteriaName; }
        public void setCriteriaName(String criteriaName) { this.criteriaName = criteriaName; }
        public Double getAverage() { return average; }
        public void setAverage(Double average) { this.average = average; }
    }

    public static class EmployeeRankingDto {
        private Long employeeId;
        private String employeeName;
        private Long departmentId;
        private String departmentName;
        private Double averageScore;

        public EmployeeRankingDto() {}

        public EmployeeRankingDto(Long employeeId, String employeeName, Double averageScore) {
            this(employeeId, employeeName, null, null, averageScore);
        }

        public EmployeeRankingDto(Long employeeId, String employeeName, String departmentName, Double averageScore) {
            this(employeeId, employeeName, null, departmentName, averageScore);
        }

        public EmployeeRankingDto(Long employeeId, String employeeName, Long departmentId, String departmentName, Double averageScore) {
            this.employeeId = employeeId;
            this.employeeName = employeeName;
            this.departmentId = departmentId;
            this.departmentName = departmentName;
            this.averageScore = averageScore;
        }

        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Double getAverageScore() { return averageScore; }
        public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
    }

    public static class EmployeeCriteriaAverageDto {
        private Long criteriaId;
        private String criteriaName;
        private Double average;

        public EmployeeCriteriaAverageDto() {}

        public EmployeeCriteriaAverageDto(Long criteriaId, String criteriaName, Double average) {
            this.criteriaId = criteriaId;
            this.criteriaName = criteriaName;
            this.average = average;
        }

        public Long getCriteriaId() { return criteriaId; }
        public void setCriteriaId(Long criteriaId) { this.criteriaId = criteriaId; }
        public String getCriteriaName() { return criteriaName; }
        public void setCriteriaName(String criteriaName) { this.criteriaName = criteriaName; }
        public Double getAverage() { return average; }
        public void setAverage(Double average) { this.average = average; }
    }

    public static class EmployeeFeedbackDetailReportDto {
        private Long employeeId;
        private String employeeName;
        private Long departmentId;
        private String departmentName;
        private Double totalAverageScore;
        private List<EmployeeCriteriaAverageDto> criteriaAverages;

        public EmployeeFeedbackDetailReportDto() {}

        public EmployeeFeedbackDetailReportDto(
                Long employeeId,
                String employeeName,
                Long departmentId,
                String departmentName,
                Double totalAverageScore,
                List<EmployeeCriteriaAverageDto> criteriaAverages) {
            this.employeeId = employeeId;
            this.employeeName = employeeName;
            this.departmentId = departmentId;
            this.departmentName = departmentName;
            this.totalAverageScore = totalAverageScore;
            this.criteriaAverages = criteriaAverages;
        }

        public Long getEmployeeId() { return employeeId; }
        public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
        public String getEmployeeName() { return employeeName; }
        public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Double getTotalAverageScore() { return totalAverageScore; }
        public void setTotalAverageScore(Double totalAverageScore) { this.totalAverageScore = totalAverageScore; }
        public List<EmployeeCriteriaAverageDto> getCriteriaAverages() { return criteriaAverages; }
        public void setCriteriaAverages(List<EmployeeCriteriaAverageDto> criteriaAverages) { this.criteriaAverages = criteriaAverages; }
    }

    public static class TopBottomEmployeeSummaryDto {
        private EmployeeRankingDto topEmployee;
        private EmployeeRankingDto bottomEmployee;

        public TopBottomEmployeeSummaryDto() {}

        public TopBottomEmployeeSummaryDto(EmployeeRankingDto topEmployee, EmployeeRankingDto bottomEmployee) {
            this.topEmployee = topEmployee;
            this.bottomEmployee = bottomEmployee;
        }

        public EmployeeRankingDto getTopEmployee() { return topEmployee; }
        public void setTopEmployee(EmployeeRankingDto topEmployee) { this.topEmployee = topEmployee; }
        public EmployeeRankingDto getBottomEmployee() { return bottomEmployee; }
        public void setBottomEmployee(EmployeeRankingDto bottomEmployee) { this.bottomEmployee = bottomEmployee; }
    }

    public static class DepartmentAverageDto {
        private Long departmentId;
        private String departmentName;
        private Double averageScore;

        public DepartmentAverageDto() {}

        public DepartmentAverageDto(Long departmentId, String departmentName, Double averageScore) {
            this.departmentId = departmentId;
            this.departmentName = departmentName;
            this.averageScore = averageScore;
        }

        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public Double getAverageScore() { return averageScore; }
        public void setAverageScore(Double averageScore) { this.averageScore = averageScore; }
    }

    public static class DepartmentTrendPoint {
        private String period;
        private Double average;

        public DepartmentTrendPoint() {}

        public DepartmentTrendPoint(String period, Double average) {
            this.period = period;
            this.average = average;
        }

        public String getPeriod() { return period; }
        public void setPeriod(String period) { this.period = period; }
        public Double getAverage() { return average; }
        public void setAverage(Double average) { this.average = average; }
    }

    public static class DepartmentTrendDto {
        private Long departmentId;
        private String departmentName;
        private List<DepartmentTrendPoint> points;

        public DepartmentTrendDto() {}

        public DepartmentTrendDto(Long departmentId, String departmentName, List<DepartmentTrendPoint> points) {
            this.departmentId = departmentId;
            this.departmentName = departmentName;
            this.points = points;
        }

        public Long getDepartmentId() { return departmentId; }
        public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public List<DepartmentTrendPoint> getPoints() { return points; }
        public void setPoints(List<DepartmentTrendPoint> points) { this.points = points; }
    }
}
