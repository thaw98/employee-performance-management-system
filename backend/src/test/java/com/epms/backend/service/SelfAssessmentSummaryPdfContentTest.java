package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.EmployeeInfoDto;
import com.epms.backend.dto.selfassessmentform.ScoreRecordDto;
import com.epms.backend.dto.selfassessmentform.report.SelfAssessmentSummaryReportData;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.repository.ReviewCycleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Method;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentSummaryPdfContentTest {

    @Mock
    private SelfAssessmentFormService formService;
    @Mock
    private ReviewCycleRepository reviewCycleRepository;

    private SelfAssessmentReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new SelfAssessmentReportService(formService, reviewCycleRepository);
        ReflectionTestUtils.setField(reportService, "reportTemplatePath", "classpath:reports/");
    }

    @Test
    void generateSummaryPdf_includesSummaryMetricValues() throws Exception {
        Employee employee = new Employee();
        ReviewCycle cycle = cycle(7L, "Q1 2026-2027");
        when(reviewCycleRepository.findById(7L)).thenReturn(Optional.of(cycle));
        when(formService.getScoreRecords(employee, 1L)).thenReturn(List.of(
                record(1L, 7L, 90.0),
                record(2L, 7L, 60.0)));

        SelfAssessmentSummaryReportData data = reportService.getSummaryReportData(employee, 1L, 7L);
        Method fillReport = SelfAssessmentReportService.class.getDeclaredMethod(
                "fillReport", String.class, List.class, Map.class);
        fillReport.setAccessible(true);
        Object jasperPrint = fillReport.invoke(
                reportService,
                "self_assessment_summary_report.jrxml",
                data.rows(),
                Map.of(
                        "REPORT_TITLE", "Self-Assessment Summary Report",
                        "COMPANY_NAME", "Ace Data Systems Ltd.",
                        "CYCLE_NAME", data.cycleName(),
                        "TOTAL_RECORDS", String.valueOf(data.totalRecords()),
                        "AVERAGE_SCORE", data.averageScore() + "%",
                        "LOWEST_SCORE", data.lowestScore() + "%",
                        "GENERATED_AT", "20 May 2026 10:04 PM"));

        String renderedText = collectPrintText(jasperPrint);

        assertTrue(renderedText.contains("2"), "Report should render total records: " + renderedText);
        assertTrue(renderedText.contains("75.0%"), "Report should render average score: " + renderedText);
        assertTrue(renderedText.contains("60.0%"), "Report should render lowest score: " + renderedText);
    }

    @SuppressWarnings("unchecked")
    private static String collectPrintText(Object jasperPrint) throws ReflectiveOperationException {
        StringBuilder builder = new StringBuilder();
        Class<?> jasperPrintClass = Class.forName("net.sf.jasperreports.engine.JasperPrint");
        List<Object> pages = (List<Object>) jasperPrintClass.getMethod("getPages").invoke(jasperPrint);
        Class<?> printPageClass = Class.forName("net.sf.jasperreports.engine.base.JRBasePrintPage");
        Class<?> printTextClass = Class.forName("net.sf.jasperreports.engine.JRPrintText");

        for (Object page : pages) {
            List<Object> elements = (List<Object>) printPageClass.getMethod("getElements").invoke(page);
            for (Object element : elements) {
                if (!printTextClass.isInstance(element)) {
                    continue;
                }
                String fullText = (String) printTextClass.getMethod("getFullText").invoke(element);
                if (fullText != null && !fullText.isBlank()) {
                    builder.append(fullText).append(' ');
                }
            }
        }
        return builder.toString();
    }

    private static ReviewCycle cycle(Long id, String name) {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setId(id);
        cycle.setName(name);
        cycle.setCode(name.replace(' ', '-'));
        cycle.setStartDate(LocalDate.of(2026, 5, 1));
        cycle.setEndDate(LocalDate.of(2026, 5, 31));
        cycle.setRequiresEmployeeSubmission(true);
        return cycle;
    }

    private static ScoreRecordDto record(Long id, Long cycleId, Double score) {
        return new ScoreRecordDto(
                id,
                new EmployeeInfoDto(
                        id,
                        "EMP-" + id,
                        "Employee " + id,
                        "employee" + id + "@example.com",
                        10L,
                        "Engineering",
                        "ENG",
                        20L,
                        "Developer",
                        "DEV",
                        3L),
                "FINALIZED_LOCKED",
                score,
                "Good",
                cycleId,
                "Q1 2026-2027",
                Instant.parse("2026-05-02T00:00:00Z"),
                Instant.parse("2026-05-01T00:00:00Z"),
                Instant.parse("2026-05-05T00:00:00Z"));
    }
}
