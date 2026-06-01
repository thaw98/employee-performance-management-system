package com.epms.backend.service;

import com.epms.backend.dto.pip.report.PipIndividualReportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.lang.reflect.Method;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class PipIndividualReportTemplateTest {

    @Mock
    private PipService pipService;

    private PipReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new PipReportService(pipService, null, null);
        ReflectionTestUtils.setField(reportService, "reportTemplatePath", "classpath:reports/");
    }

    @Test
    void renderIndividualPipReportTemplate() throws Exception {
        PipIndividualReportDto report = new PipIndividualReportDto();
        report.setPipId(8L);
        report.setEmployeeStaffNo("E008");
        report.setEmployeeName("Mike Chen");
        report.setEmployeeDepartment("Engineering");
        report.setEmployeePosition("Software Engineer");
        report.setManagerName("Min Min Tun");
        report.setManagerDepartment("HR");
        report.setKpiScore(null);
        report.setStatus("ACTIVE");
        report.setStartDate(LocalDate.of(2026, 6, 1));
        report.setEndDate(LocalDate.of(2026, 6, 5));
        report.setOriginalEndDate(LocalDate.of(2026, 6, 4));
        report.setActualEndDate(null);
        report.setTotalHours(15);
        report.setCompletedHours(0);
        report.setOverallProgress(null);
        report.setReasonForPlan("ok");
        report.setExpectedImprovements("form1\nform2");
        report.setFinalOutcome(null);
        report.setClosingRemarks(null);
        report.setEmployeeSignatureDate(null);
        report.setManagerSignatureDate(null);
        report.setEmployeeSignature(null);
        report.setManagerSignature(null);
        report.setObjectivesSummary(null);
        report.setMeetingsSummary(null);
        report.setProgressUpdatesSummary(null);
        report.setObjectives(null);
        report.setMeetings(null);
        report.setProgressUpdates(null);

        Method fillReport = PipReportService.class.getDeclaredMethod(
                "fillReport", String.class, List.class, Map.class);
        fillReport.setAccessible(true);

        Object jasperPrint = fillReport.invoke(
                reportService,
                "pip_individual_report.jrxml",
                List.of(report),
                Map.of(
                        "REPORT_TITLE", "Individual PIP Report",
                        "COMPANY_NAME", "Ace Data Systems Ltd.",
                        "FILTER_DESCRIPTION", "PIP #8",
                        "GENERATED_AT", "01 Jun 2026 02:26 PM"));

        String renderedText = collectPrintText(jasperPrint);
        assertTrue(renderedText.contains("Overall Progress"),
                "Rendered template should include Overall Progress label: " + renderedText);
    }

    @SuppressWarnings("unchecked")
    private static String collectPrintText(Object jasperPrint) throws ReflectiveOperationException {
        StringBuilder builder = new StringBuilder();
        Class<?> jasperPrintClass = Class.forName("net.sf.jasperreports.engine.JasperPrint");
        var pages = (java.util.List<Object>) jasperPrintClass.getMethod("getPages").invoke(jasperPrint);
        Class<?> printPageClass = Class.forName("net.sf.jasperreports.engine.base.JRBasePrintPage");
        Class<?> printTextClass = Class.forName("net.sf.jasperreports.engine.JRPrintText");

        for (Object page : pages) {
            var elements = (java.util.List<Object>) printPageClass.getMethod("getElements").invoke(page);
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
}
