package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.ScoreRecordDto;
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
import java.util.stream.IntStream;

@Service
@Slf4j
@RequiredArgsConstructor
public class SelfAssessmentReportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter GENERATED_AT_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a", Locale.ENGLISH);

    private final SelfAssessmentFormService selfAssessmentFormService;
    private final ReviewCycleRepository reviewCycleRepository;

    @Value("${epms.reports.template-path:classpath:reports/}")
    private String reportTemplatePath;

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

    private String formatSummaryScore(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value + "%";
    }
}
