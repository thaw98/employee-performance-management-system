package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.ScoreRecordDto;
import com.epms.backend.dto.selfassessmentform.report.SelfAssessmentAnalyticsReportDto;
import com.epms.backend.dto.selfassessmentform.report.SelfAssessmentSummaryReportData;
import com.epms.backend.dto.selfassessmentform.report.SelfAssessmentSummaryReportRow;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.repository.ReviewCycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.IntStream;

@Service
@Slf4j
@RequiredArgsConstructor
public class SelfAssessmentReportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter GENERATED_AT_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a", Locale.ENGLISH);

    private final SelfAssessmentFormService selfAssessmentFormService;
    private final ReviewCycleRepository reviewCycleRepository;

    private static final List<String> PERFORMANCE_BANDS = List.of(
            "Outstanding",
            "Good",
            "Meet Requirement",
            "Need Improvement",
            "Unsatisfactory");

    @Value("${epms.reports.template-path:classpath:reports/}")
    private String reportTemplatePath;

    @Transactional
    public SelfAssessmentAnalyticsReportDto getAnalyticsReportData(Employee employee, Long roleId, Long cycleId) {
        if (cycleId == null || cycleId <= 0) {
            throw new IllegalArgumentException("cycleId is required");
        }
        if (roleId == null || (roleId != 1L && roleId != 2L)) {
            throw new IllegalArgumentException("Unauthorized");
        }

        ReviewCycle cycle = reviewCycleRepository.findById(cycleId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown review cycle"));
        ReviewCycle previousCycle = findPreviousEmployeeSubmissionCycle(cycle);

        List<ReportRecord> records = selfAssessmentFormService.getScoreRecords(employee, roleId).stream()
                .filter(record -> Objects.equals(record.cycleId(), cycleId))
                .filter(record -> roleId == 1L || isInManagerCurrentDepartment(record, employee))
                .map(this::toReportRecord)
                .sorted(Comparator.comparing(ReportRecord::groupName, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(ReportRecord::employeeName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        Map<Long, ReportRecord> previousByEmployeeId = previousCycle == null ? Map.of()
                : selfAssessmentFormService.getScoreRecords(employee, roleId).stream()
                .filter(record -> Objects.equals(record.cycleId(), previousCycle.getId()))
                .filter(record -> roleId == 1L || isInManagerCurrentDepartment(record, employee))
                .map(this::toReportRecord)
                .filter(record -> record.employeeId() != null)
                .collect(java.util.stream.Collectors.toMap(
                        ReportRecord::employeeId,
                        Function.identity(),
                        (left, right) -> left));

        boolean isHr = roleId == 1L;
        List<SelfAssessmentAnalyticsReportDto.GroupSummary> departmentSummaries = buildGroupSummaries(
                records,
                ReportRecord::departmentId,
                ReportRecord::departmentCode,
                ReportRecord::departmentName,
                ReportRecord::departmentId,
                ReportRecord::departmentName);
        List<SelfAssessmentAnalyticsReportDto.GroupSummary> positionSummaries = buildGroupSummaries(
                records,
                ReportRecord::positionId,
                ReportRecord::positionCode,
                ReportRecord::positionName,
                ReportRecord::departmentId,
                ReportRecord::departmentName);

        List<SelfAssessmentAnalyticsReportDto.GroupSummary> rankedDepartments = departmentSummaries.stream()
                .sorted(Comparator.comparing(SelfAssessmentAnalyticsReportDto.GroupSummary::averageScore).reversed())
                .toList();

        return new SelfAssessmentAnalyticsReportDto(
                isHr ? "hr" : "manager",
                toCycleMetadata(cycle),
                previousCycle == null ? null : toCycleMetadata(previousCycle),
                buildOverallTotals(records),
                isHr && !rankedDepartments.isEmpty() ? rankedDepartments.get(0) : null,
                isHr && !rankedDepartments.isEmpty() ? rankedDepartments.get(rankedDepartments.size() - 1) : null,
                departmentSummaries,
                positionSummaries,
                buildRadar(records, isHr ? ReportRecord::departmentName : ReportRecord::positionName),
                buildHighlights(records, isHr ? ReportRecord::departmentName : ReportRecord::positionName),
                buildEmployeeDirectory(records, previousByEmployeeId));
    }

    @Transactional
    public SelfAssessmentSummaryReportData getSummaryReportData(Employee employee, Long roleId, Long cycleId) {
        if (cycleId == null || cycleId <= 0) {
            throw new IllegalArgumentException("cycleId is required");
        }

        ReviewCycle cycle = reviewCycleRepository.findById(cycleId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown review cycle"));

        List<ScoreRecordDto> selectedRecords = selfAssessmentFormService.getScoreRecords(employee, roleId).stream()
                .filter(record -> Objects.equals(record.cycleId(), cycleId))
                .sorted(Comparator.comparing(ScoreRecordDto::createdDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<Double> scoredValues = selectedRecords.stream()
                .map(ScoreRecordDto::finalApprovedScore)
                .filter(Objects::nonNull)
                .toList();

        double average = scoredValues.stream().mapToDouble(Double::doubleValue).average().orElse(Double.NaN);
        double highest = scoredValues.stream().mapToDouble(Double::doubleValue).max().orElse(Double.NaN);
        double lowest = scoredValues.stream().mapToDouble(Double::doubleValue).min().orElse(Double.NaN);

        List<SelfAssessmentSummaryReportRow> rows = IntStream.range(0, selectedRecords.size())
                .mapToObj(index -> toReportRow(selectedRecords.get(index), index + 1))
                .toList();

        return new SelfAssessmentSummaryReportData(
                cycle.getId(),
                defaultText(cycle.getName(), "Cycle #" + cycleId),
                selectedRecords.size(),
                Double.isNaN(average) ? "" : formatScore(average),
                Double.isNaN(highest) ? "" : formatScore(highest),
                Double.isNaN(lowest) ? "" : formatScore(lowest),
                rows);
    }

    private ReviewCycle findPreviousEmployeeSubmissionCycle(ReviewCycle selectedCycle) {
        return reviewCycleRepository.findAll().stream()
                .filter(ReviewCycle::isRequiresEmployeeSubmission)
                .filter(c -> !Objects.equals(c.getId(), selectedCycle.getId()))
                .filter(c -> {
                    if (selectedCycle.getStartDate() != null && c.getEndDate() != null) {
                        return c.getEndDate().isBefore(selectedCycle.getStartDate());
                    }
                    if (selectedCycle.getStartDate() != null && c.getStartDate() != null) {
                        return c.getStartDate().isBefore(selectedCycle.getStartDate());
                    }
                    return c.getId() != null && selectedCycle.getId() != null && c.getId() < selectedCycle.getId();
                })
                .max(Comparator
                        .comparing(ReviewCycle::getEndDate, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(ReviewCycle::getStartDate, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(ReviewCycle::getId, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
    }

    private boolean isInManagerCurrentDepartment(ScoreRecordDto record, Employee manager) {
        Long managerDepartmentId = manager != null && manager.getDepartment() != null ? manager.getDepartment().getId() : null;
        Long recordDepartmentId = record.employee() != null ? record.employee().departmentId() : null;
        return managerDepartmentId != null && managerDepartmentId.equals(recordDepartmentId);
    }

    private List<SelfAssessmentAnalyticsReportDto.GroupSummary> buildGroupSummaries(
            List<ReportRecord> records,
            Function<ReportRecord, Long> groupIdResolver,
            Function<ReportRecord, String> groupCodeResolver,
            Function<ReportRecord, String> groupNameResolver,
            Function<ReportRecord, Long> departmentIdResolver,
            Function<ReportRecord, String> departmentNameResolver) {
        return records.stream()
                .collect(java.util.stream.Collectors.groupingBy(record -> new GroupKey(
                        groupIdResolver.apply(record),
                        defaultNullableText(groupCodeResolver.apply(record)),
                        defaultText(groupNameResolver.apply(record), "Unassigned"),
                        departmentIdResolver.apply(record),
                        defaultNullableText(departmentNameResolver.apply(record)))))
                .entrySet()
                .stream()
                .map(entry -> {
                    List<ReportRecord> groupRecords = entry.getValue();
                    GroupKey key = entry.getKey();
                    return new SelfAssessmentAnalyticsReportDto.GroupSummary(
                            key.groupId(),
                            key.groupCode(),
                            key.departmentId(),
                            key.departmentName(),
                            key.groupName(),
                            groupRecords.size(),
                            round1(groupRecords.stream().mapToDouble(ReportRecord::score).average().orElse(0)),
                            round1(groupRecords.stream().mapToDouble(ReportRecord::score).max().orElse(0)),
                            round1(groupRecords.stream().mapToDouble(ReportRecord::score).min().orElse(0)),
                            (int) groupRecords.stream().filter(ReportRecord::missed).count());
                })
                .sorted(Comparator.comparing(SelfAssessmentAnalyticsReportDto.GroupSummary::averageScore).reversed()
                        .thenComparing(SelfAssessmentAnalyticsReportDto.GroupSummary::groupName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private SelfAssessmentAnalyticsReportDto.OverallTotals buildOverallTotals(List<ReportRecord> records) {
        return new SelfAssessmentAnalyticsReportDto.OverallTotals(
                records.size(),
                round1(records.stream().mapToDouble(ReportRecord::score).average().orElse(0)),
                round1(records.stream().mapToDouble(ReportRecord::score).max().orElse(0)),
                round1(records.stream().mapToDouble(ReportRecord::score).min().orElse(0)),
                (int) records.stream().filter(ReportRecord::missed).count());
    }

    private List<SelfAssessmentAnalyticsReportDto.PerformanceBandRadarPoint> buildRadar(
            List<ReportRecord> records,
            Function<ReportRecord, String> groupResolver) {
        return records.stream()
                .collect(java.util.stream.Collectors.groupingBy(record -> defaultText(groupResolver.apply(record), "Unassigned")))
                .entrySet()
                .stream()
                .map(entry -> {
                    List<ReportRecord> groupRecords = entry.getValue();
                    int total = groupRecords.size();
                    Map<String, Long> counts = groupRecords.stream()
                            .collect(java.util.stream.Collectors.groupingBy(ReportRecord::performance, java.util.stream.Collectors.counting()));
                    int outstanding = counts.getOrDefault("Outstanding", 0L).intValue();
                    int good = counts.getOrDefault("Good", 0L).intValue();
                    int meet = counts.getOrDefault("Meet Requirement", 0L).intValue();
                    int need = counts.getOrDefault("Need Improvement", 0L).intValue();
                    int unsatisfactory = counts.getOrDefault("Unsatisfactory", 0L).intValue();
                    return new SelfAssessmentAnalyticsReportDto.PerformanceBandRadarPoint(
                            entry.getKey(),
                            outstanding,
                            good,
                            meet,
                            need,
                            unsatisfactory,
                            percent(outstanding, total),
                            percent(good, total),
                            percent(meet, total),
                            percent(need, total),
                            percent(unsatisfactory, total));
                })
                .sorted(Comparator.comparing(SelfAssessmentAnalyticsReportDto.PerformanceBandRadarPoint::groupName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private List<SelfAssessmentAnalyticsReportDto.PerformerHighlight> buildHighlights(
            List<ReportRecord> records,
            Function<ReportRecord, String> groupResolver) {
        return records.stream()
                .collect(java.util.stream.Collectors.groupingBy(record -> defaultText(groupResolver.apply(record), "Unassigned")))
                .entrySet()
                .stream()
                .map(entry -> {
                    List<ReportRecord> groupRecords = entry.getValue();
                    double highest = groupRecords.stream().mapToDouble(ReportRecord::score).max().orElse(0);
                    double lowest = groupRecords.stream().mapToDouble(ReportRecord::score).min().orElse(0);
                    return new SelfAssessmentAnalyticsReportDto.PerformerHighlight(
                            entry.getKey(),
                            groupRecords.stream().filter(record -> Double.compare(record.score(), highest) == 0).map(this::toPerformerScore).toList(),
                            groupRecords.stream().filter(record -> Double.compare(record.score(), lowest) == 0).map(this::toPerformerScore).toList());
                })
                .sorted(Comparator.comparing(SelfAssessmentAnalyticsReportDto.PerformerHighlight::groupName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private List<SelfAssessmentAnalyticsReportDto.EmployeeDirectoryRow> buildEmployeeDirectory(
            List<ReportRecord> records,
            Map<Long, ReportRecord> previousByEmployeeId) {
        return records.stream()
                .map(record -> {
                    ReportRecord previous = previousByEmployeeId.get(record.employeeId());
                    Double previousScore = previous == null ? null : previous.score();
                    return new SelfAssessmentAnalyticsReportDto.EmployeeDirectoryRow(
                            record.employeeId(),
                            record.staffNo(),
                            record.employeeName(),
                            record.departmentId(),
                            record.departmentName(),
                            record.positionId(),
                            record.positionName(),
                            record.score(),
                            record.performance(),
                            record.status(),
                            previousScore,
                            previousScore == null ? null : round1(record.score() - previousScore));
                })
                .sorted(Comparator.comparing(SelfAssessmentAnalyticsReportDto.EmployeeDirectoryRow::employeeName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private SelfAssessmentAnalyticsReportDto.PerformerScore toPerformerScore(ReportRecord record) {
        return new SelfAssessmentAnalyticsReportDto.PerformerScore(
                record.employeeId(),
                record.staffNo(),
                record.employeeName(),
                record.departmentName(),
                record.positionName(),
                record.score(),
                record.performance(),
                record.status());
    }

    private ReportRecord toReportRecord(ScoreRecordDto record) {
        double score = "NOT_SUBMITTED".equals(record.status()) ? 0.0 : record.finalApprovedScore() == null ? 0.0 : record.finalApprovedScore();
        String performance = "NOT_SUBMITTED".equals(record.status()) ? "Unsatisfactory" : defaultText(record.performance(), ratingCategory(score));
        return new ReportRecord(
                record.employee() == null ? null : record.employee().id(),
                record.employee() == null ? "" : record.employee().employeeId(),
                record.employee() == null ? "" : record.employee().employeeName(),
                record.employee() == null ? null : record.employee().departmentId(),
                record.employee() == null ? "" : record.employee().departmentName(),
                record.employee() == null ? "" : record.employee().departmentCode(),
                record.employee() == null ? null : record.employee().positionId(),
                record.employee() == null ? "" : record.employee().positionName(),
                record.employee() == null ? "" : record.employee().positionCode(),
                score,
                performance,
                defaultText(record.status(), ""),
                "NOT_SUBMITTED".equals(record.status()));
    }

    private SelfAssessmentAnalyticsReportDto.CycleMetadata toCycleMetadata(ReviewCycle cycle) {
        return new SelfAssessmentAnalyticsReportDto.CycleMetadata(
                cycle.getId(),
                defaultText(cycle.getName(), "Cycle #" + cycle.getId()),
                cycle.getStartDate() == null ? null : cycle.getStartDate().toString(),
                cycle.getEndDate() == null ? null : cycle.getEndDate().toString());
    }

    private String ratingCategory(double score) {
        if (score >= 86) return PERFORMANCE_BANDS.get(0);
        if (score >= 71) return PERFORMANCE_BANDS.get(1);
        if (score >= 60) return PERFORMANCE_BANDS.get(2);
        if (score >= 40) return PERFORMANCE_BANDS.get(3);
        return PERFORMANCE_BANDS.get(4);
    }

    private double percent(int count, int total) {
        if (total <= 0) return 0;
        return round1((count * 100.0) / total);
    }

    private double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record ReportRecord(
            Long employeeId,
            String staffNo,
            String employeeName,
            Long departmentId,
            String departmentName,
            String departmentCode,
            Long positionId,
            String positionName,
            String positionCode,
            double score,
            String performance,
            String status,
            boolean missed
    ) {
        String groupName() {
            return departmentName;
        }
    }

    private record GroupKey(
            Long groupId,
            String groupCode,
            String groupName,
            Long departmentId,
            String departmentName
    ) {}

    @Transactional
    public byte[] generateSummaryPdf(Employee employee, Long roleId, Long cycleId) {
        SelfAssessmentSummaryReportData data = getSummaryReportData(employee, roleId, cycleId);
        Object jasperPrint = fillReport(
                "self_assessment_summary_report.jrxml",
                data.rows(),
                Map.of(
                        "REPORT_TITLE", "Self-Assessment Summary Report",
                        "COMPANY_NAME", "Ace Data Systems Ltd.",
                        "CYCLE_NAME", data.cycleName(),
                        "TOTAL_RECORDS", String.valueOf(data.totalRecords()),
                        "AVERAGE_SCORE", formatSummaryScore(data.averageScore()),
                        "HIGHEST_SCORE", formatSummaryScore(data.highestScore()),
                        "LOWEST_SCORE", formatSummaryScore(data.lowestScore()),
                        "GENERATED_AT", GENERATED_AT_FORMAT.format(Instant.now().atZone(ZoneId.systemDefault()))));
        return exportPdf(jasperPrint);
    }

    private SelfAssessmentSummaryReportRow toReportRow(ScoreRecordDto record, int rowNumber) {
        return new SelfAssessmentSummaryReportRow(
                rowNumber,
                record.employee() == null ? "" : defaultText(record.employee().employeeName(), ""),
                record.employee() == null ? "" : defaultText(record.employee().employeeId(), ""),
                record.employee() == null ? "" : defaultText(record.employee().departmentName(), ""),
                record.employee() == null ? "" : defaultText(record.employee().positionName(), ""),
                record.finalApprovedScore() == null ? "" : formatScore(record.finalApprovedScore()) + "%",
                defaultText(record.performance(), ""),
                formatStatus(record.status()),
                formatDate(record.submittedDate()),
                formatDate(record.finalApprovalDate()));
    }

    private Object fillReport(String templateName, List<?> rows, Map<String, Object> parameters) {
        log.debug("Filling self-assessment report template: {}, rows count: {}", templateName, rows == null ? 0 : rows.size());
        try (InputStream inputStream = resolveTemplate(templateName).getInputStream()) {
            Class<?> compileManagerClass = Class.forName("net.sf.jasperreports.engine.JasperCompileManager");
            Class<?> fillManagerClass = Class.forName("net.sf.jasperreports.engine.JasperFillManager");
            Class<?> jasperReportClass = Class.forName("net.sf.jasperreports.engine.JasperReport");
            Class<?> jrDataSourceClass = Class.forName("net.sf.jasperreports.engine.JRDataSource");
            Class<?> beanDataSourceClass = Class.forName("net.sf.jasperreports.engine.data.JRBeanCollectionDataSource");

            Object jasperReport = compileManagerClass
                    .getMethod("compileReport", InputStream.class)
                    .invoke(null, inputStream);
            Object dataSource = beanDataSourceClass
                    .getConstructor(Collection.class)
                    .newInstance(rows == null ? List.of() : rows);
            return fillManagerClass
                    .getMethod("fillReport", jasperReportClass, Map.class, jrDataSourceClass)
                    .invoke(null, jasperReport, new HashMap<>(parameters), dataSource);
        } catch (ReflectiveOperationException | IOException e) {
            throw new IllegalStateException("Failed to build self-assessment summary report", e);
        }
    }

    private byte[] exportPdf(Object jasperPrint) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Class<?> jasperPrintClass = Class.forName("net.sf.jasperreports.engine.JasperPrint");
            Class<?> exportManagerClass = Class.forName("net.sf.jasperreports.engine.JasperExportManager");
            exportManagerClass
                    .getMethod("exportReportToPdfStream", jasperPrintClass, java.io.OutputStream.class)
                    .invoke(null, jasperPrint, outputStream);
            return outputStream.toByteArray();
        } catch (ReflectiveOperationException | IOException e) {
            throw new IllegalStateException("Failed to generate self-assessment summary PDF", e);
        }
    }

    private Resource resolveTemplate(String templateName) {
        String normalizedPath = reportTemplatePath.endsWith("/") ? reportTemplatePath : reportTemplatePath + "/";
        String location = normalizedPath + templateName;
        if (location.startsWith("classpath:")) {
            return new ClassPathResource(location.substring("classpath:".length()));
        }
        return new FileSystemResource(location);
    }

    private String formatDate(Instant value) {
        return value == null ? "" : DATE_FORMAT.format(value.atZone(ZoneId.systemDefault()));
    }

    private String formatScore(double value) {
        return String.format(Locale.ENGLISH, "%.1f", value);
    }

    private String formatStatus(String status) {
        if (status == null || status.isBlank()) {
            return "";
        }
        String[] words = status.trim().split("_+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (word.isBlank()) continue;
            if (result.length() > 0) result.append(' ');
            result.append(word.substring(0, 1).toUpperCase(Locale.ENGLISH));
            result.append(word.substring(1).toLowerCase(Locale.ENGLISH));
        }
        return result.toString();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String defaultNullableText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String formatSummaryScore(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value + "%";
    }
}
