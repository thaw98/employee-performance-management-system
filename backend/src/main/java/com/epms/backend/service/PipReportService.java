package com.epms.backend.service;

import com.epms.backend.dto.pip.report.PipIndividualReportDto;
import com.epms.backend.dto.pip.report.PipProgressReportDto;
import com.epms.backend.dto.pip.report.PipSummaryReportDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.FollowUpMeeting;
import com.epms.backend.entity.Pip;
import com.epms.backend.entity.PipObjective;
import com.epms.backend.entity.PipProgressUpdate;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PipProgressUpdateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PipReportService {

    private static final String FORMAT_EXCEL = "excel";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a",
            Locale.ENGLISH);
    private static final DateTimeFormatter GENERATED_AT_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy hh:mm a",
            Locale.ENGLISH);

    private final PipService pipService;
    private final PipProgressUpdateRepository progressUpdateRepository;
    private final DepartmentRepository departmentRepository;

    @Value("${epms.reports.template-path:classpath:reports/}")
    private String reportTemplatePath;

    @Value("${epms.upload.signatures-dir:uploads/signatures}")
    private String signatureUploadDir;

    @Transactional(readOnly = true)
    public PipIndividualReportDto getIndividualPipReport(Long pipId, User actor) {
        Pip pip = pipService.getPipById(pipId, actor);
        List<PipProgressUpdate> progressUpdates = progressUpdateRepository.findByPipOrderByCreatedDateDesc(pip);
        return toIndividualDto(pip, progressUpdates);
    }

    @Transactional(readOnly = true)
    public List<PipSummaryReportDto> getPipSummaryReport(
            String status,
            Long departmentId,
            Long positionId,
            String employeeName,
            Long employeeId,
            Long pipId,
            LocalDate startDate,
            LocalDate endDate,
            User actor) {
        return filterReportPips(status, departmentId, positionId, employeeName, employeeId, pipId, startDate, endDate,
                actor)
                .stream()
                .sorted(Comparator.comparing(Pip::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toSummaryDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public PipProgressReportDto getPipProgressReport(
            String status,
            Long departmentId,
            Long positionId,
            String employeeName,
            Long employeeId,
            Long pipId,
            LocalDate startDate,
            LocalDate endDate,
            User actor) {
        List<Pip> pips = filterReportPips(status, departmentId, positionId, employeeName, employeeId, pipId, startDate,
                endDate, actor);
        PipProgressReportDto progressDto = toProgressDto(pips, departmentId, startDate, endDate, actor);
        return progressDto;
    }

    @Transactional(readOnly = true)
    public byte[] generateIndividualPipReport(Long pipId, String format, User actor) {
        log.info("Starting report generation for PIP {} with format {}", pipId, format);
        PipIndividualReportDto report = getIndividualPipReport(pipId, actor);
        log.debug("Report DTO loaded: pipId={}, employee={}, status={}",
                report.getPipId(), report.getEmployeeName(), report.getStatus());
        if (isExcelFormat(format)) {
            return generateIndividualExcelReport(report);
        }
        Object jasperPrint = fillReport(
                "pip_individual_report.jrxml",
                List.of(report),
                Map.of("REPORT_TITLE", "Individual PIP Report",
                        "COMPANY_NAME", "Ace Data Systems Ltd.",
                        "FILTER_DESCRIPTION", "PIP #" + pipId,
                        "GENERATED_AT", formatGeneratedAt()));
        log.info("Report filled successfully for PIP {}", pipId);
        return export(jasperPrint, format);
    }

    @Transactional(readOnly = true)
    public byte[] generateSummaryReport(
            String status,
            Long departmentId,
            Long positionId,
            String employeeName,
            Long employeeId,
            Long pipId,
            LocalDate startDate,
            LocalDate endDate,
            String format,
            User actor) {
        List<PipSummaryReportDto> rows = getPipSummaryReport(status, departmentId, positionId, employeeName,
                employeeId, pipId, startDate, endDate, actor);
        if (isExcelFormat(format)) {
            return generateSummaryExcelReport(rows);
        }
        Object jasperPrint = fillReport(
                "pip_summary_report.jrxml",
                rows,
                Map.of("REPORT_TITLE", "PIP Summary Report",
                        "COMPANY_NAME", "Ace Data Systems Ltd.",
                        "FILTER_DESCRIPTION", buildFilterDescription(status, departmentId, positionId, employeeName,
                                employeeId, pipId, startDate, endDate, actor),
                        "TOTAL_PIPS", rows.size(),
                        "GENERATED_AT", formatGeneratedAt()));
        return export(jasperPrint, format);
    }

    @Transactional(readOnly = true)
    public byte[] generateProgressReport(
            String status,
            Long departmentId,
            Long positionId,
            String employeeName,
            Long employeeId,
            Long pipId,
            LocalDate startDate,
            LocalDate endDate,
            String format,
            User actor) {
        PipProgressReportDto report = getPipProgressReport(status, departmentId, positionId, employeeName, employeeId,
                pipId, startDate, endDate, actor);
        if (isExcelFormat(format)) {
            return generateProgressExcelReport(report);
        }
        Object jasperPrint = fillReport(
                "pip_progress_report.jrxml",
                List.of(report),
                Map.of("REPORT_TITLE", "PIP Progress Report",
                        "COMPANY_NAME", "Ace Data Systems Ltd.",
                        "FILTER_DESCRIPTION",
                        buildFilterDescription(status, departmentId, positionId, employeeName, employeeId, pipId,
                                startDate, endDate, actor),
                        "GENERATED_AT", formatGeneratedAt()));
        return export(jasperPrint, format);
    }

    private byte[] generateIndividualExcelReport(PipIndividualReportDto report) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle textStyle = createTextStyle(workbook);

            writeIndividualOverviewSheet(workbook, report, titleStyle, headerStyle, textStyle);
            writeObjectivesSheet(workbook, report, titleStyle, headerStyle, textStyle);
            writeMeetingsSheet(workbook, report, titleStyle, headerStyle, textStyle);
            writeProgressUpdatesSheet(workbook, report, titleStyle, headerStyle, textStyle);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate individual PIP Excel report", e);
        }
    }

    private void writeIndividualOverviewSheet(
            Workbook workbook,
            PipIndividualReportDto report,
            CellStyle titleStyle,
            CellStyle headerStyle,
            CellStyle textStyle) {
        Sheet sheet = workbook.createSheet("Overview");
        int rowIndex = writeTitle(sheet, 0, "Individual PIP Report", 2, titleStyle) + 1;
        rowIndex = writeHeader(sheet, rowIndex, headerStyle, "Field", "Value");
        writeRow(sheet, rowIndex++, textStyle, "PIP ID", report.getPipId());
        writeRow(sheet, rowIndex++, textStyle, "Employee ID", report.getEmployeeStaffNo());
        writeRow(sheet, rowIndex++, textStyle, "Employee Name", report.getEmployeeName());
        writeRow(sheet, rowIndex++, textStyle, "Department", report.getEmployeeDepartment());
        writeRow(sheet, rowIndex++, textStyle, "Position", report.getEmployeePosition());
        writeRow(sheet, rowIndex++, textStyle, "Manager", report.getManagerName());
        writeRow(sheet, rowIndex++, textStyle, "Manager Department", report.getManagerDepartment());
        writeRow(sheet, rowIndex++, textStyle, "KPI Score", report.getKpiScore());
        writeRow(sheet, rowIndex++, textStyle, "Status", report.getStatus());
        writeRow(sheet, rowIndex++, textStyle, "Start Date", formatExcelDate(report.getStartDate()));
        writeRow(sheet, rowIndex++, textStyle, "End Date", formatExcelDate(report.getEndDate()));
        writeRow(sheet, rowIndex++, textStyle, "Original End Date", formatExcelDate(report.getOriginalEndDate()));
        writeRow(sheet, rowIndex++, textStyle, "Actual End Date", formatExcelDate(report.getActualEndDate()));
        writeRow(sheet, rowIndex++, textStyle, "Progress %", report.getOverallProgress());
        writeRow(sheet, rowIndex++, textStyle, "Completed Hours", report.getCompletedHours());
        writeRow(sheet, rowIndex++, textStyle, "Total Hours", report.getTotalHours());
        writeRow(sheet, rowIndex++, textStyle, "Reason For Plan", report.getReasonForPlan());
        writeRow(sheet, rowIndex++, textStyle, "Expected Improvements", report.getExpectedImprovements());
        writeRow(sheet, rowIndex++, textStyle, "Final Outcome", report.getFinalOutcome());
        writeRow(sheet, rowIndex++, textStyle, "Closing Remarks", report.getClosingRemarks());
        writeRow(sheet, rowIndex++, textStyle, "Employee Signed At", formatExcelDateTime(report.getEmployeeSignatureDate()));
        writeRow(sheet, rowIndex, textStyle, "Manager Signed At", formatExcelDateTime(report.getManagerSignatureDate()));
        sheet.createFreezePane(0, 2);
        autosize(sheet, 2);
    }

    private void writeObjectivesSheet(
            Workbook workbook,
            PipIndividualReportDto report,
            CellStyle titleStyle,
            CellStyle headerStyle,
            CellStyle textStyle) {
        Sheet sheet = workbook.createSheet("Objectives");
        int rowIndex = writeTitle(sheet, 0, "Objectives", 6, titleStyle) + 1;
        rowIndex = writeHeader(sheet, rowIndex, headerStyle, "Objective ID", "Description", "Weight %",
                "Progress %", "Due Date", "Status");
        List<PipIndividualReportDto.ObjectiveRow> objectives = safeList(report.getObjectives());
        if (objectives.isEmpty()) {
            writeEmptyRow(sheet, rowIndex++, textStyle, 6, "No objectives recorded.");
        }
        for (PipIndividualReportDto.ObjectiveRow objective : objectives) {
            writeRow(sheet, rowIndex++, textStyle,
                    objective.getObjectiveId(), objective.getDescription(), objective.getWeightPercentage(),
                    objective.getProgressPercentage(), formatExcelDate(objective.getDueDate()),
                    objective.getStatus());
        }
        sheet.createFreezePane(0, 2);
        autosize(sheet, 6);
    }

    private void writeMeetingsSheet(
            Workbook workbook,
            PipIndividualReportDto report,
            CellStyle titleStyle,
            CellStyle headerStyle,
            CellStyle textStyle) {
        Sheet sheet = workbook.createSheet("Follow-up Meetings");
        int rowIndex = writeTitle(sheet, 0, "Follow-up Meetings", 7, titleStyle) + 1;
        rowIndex = writeHeader(sheet, rowIndex, headerStyle, "Meeting ID", "Scheduled Date", "Start Meeting Time",
                "End Meeting Time", "Total Hours", "Status", "Notes");
        List<PipIndividualReportDto.MeetingRow> meetings = safeList(report.getMeetings());
        if (meetings.isEmpty()) {
            writeEmptyRow(sheet, rowIndex++, textStyle, 7, "No follow-up meetings recorded.");
        }
        for (PipIndividualReportDto.MeetingRow meeting : meetings) {
            writeRow(sheet, rowIndex++, textStyle,
                    meeting.getMeetingId(), formatExcelDate(meeting.getScheduledDate()),
                    formatExcelDateTime(meeting.getMeetingTime()),
                    formatExcelDateTime(meeting.getEndMeetingTime()),
                    meeting.getTotalHours(), meeting.getStatus(), meeting.getNotes());
        }
        sheet.createFreezePane(0, 2);
        autosize(sheet, 7);
    }

    private void writeProgressUpdatesSheet(
            Workbook workbook,
            PipIndividualReportDto report,
            CellStyle titleStyle,
            CellStyle headerStyle,
            CellStyle textStyle) {
        Sheet sheet = workbook.createSheet("Progress Updates");
        int rowIndex = writeTitle(sheet, 0, "Progress Updates", 8, titleStyle) + 1;
        rowIndex = writeHeader(sheet, rowIndex, headerStyle,
                "Update ID", "Update Date", "Objective", "Previous %", "New %", "Completed Hours", "Updated By",
                "Feedback");
        List<PipIndividualReportDto.ProgressUpdateRow> updates = safeList(report.getProgressUpdates());
        if (updates.isEmpty()) {
            writeEmptyRow(sheet, rowIndex++, textStyle, 8, "No progress updates recorded.");
        }
        for (PipIndividualReportDto.ProgressUpdateRow update : updates) {
            writeRow(sheet, rowIndex++, textStyle,
                    update.getUpdateId(), formatExcelDate(update.getUpdateDate()), update.getObjectiveDescription(),
                    update.getPreviousPercentage(), update.getNewPercentage(), update.getCompletedHours(),
                    update.getUpdatedBy(), update.getFeedback());
        }
        sheet.createFreezePane(0, 2);
        autosize(sheet, 8);
    }

    private byte[] generateSummaryExcelReport(List<PipSummaryReportDto> rows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle textStyle = createTextStyle(workbook);
            CellStyle summaryStyle = createSummaryStyle(workbook);

            Sheet sheet = workbook.createSheet("PIP Summary");
            int rowIndex = writeTitle(sheet, 0, "PIP Summary Report", 16, titleStyle) + 1;
            rowIndex = writeHeader(sheet, rowIndex, headerStyle,
                    "PIP ID", "Employee ID", "Employee Name", "Department", "Position", "Manager", "KPI Score", "Status",
                    "Start Date", "End Date", "Progress %", "Completed Hours", "Total Hours",
                    "Objectives Count", "Meetings Count", "Final Outcome", "Follow-up Meeting Details");
            for (PipSummaryReportDto row : rows) {
                writeRow(sheet, rowIndex++, textStyle,
                        row.getPipId(), row.getEmployeeStaffNo(), row.getEmployeeName(), row.getDepartmentName(),
                        row.getPositionName(), row.getManagerName(), row.getKpiScore(), row.getStatus(),
                        formatExcelDate(row.getStartDate()),
                        formatExcelDate(row.getEndDate()), row.getOverallProgress(), row.getCompletedHours(),
                        row.getTotalHours(), row.getObjectivesCount(), row.getMeetingsCount(), row.getFinalOutcome(),
                        row.getFollowUpMeetingsSummary());
            }
            writeSummaryCountRow(sheet, rowIndex, summaryStyle, 17, "Total PIPs", rows.size());

            autosize(sheet, 17);
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate PIP summary Excel report", e);
        }
    }

    private byte[] generateProgressExcelReport(PipProgressReportDto report) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle textStyle = createTextStyle(workbook);

            Sheet sheet = workbook.createSheet("PIP Progress");
            int rowIndex = writeTitle(sheet, 0, "PIP Progress Report", 2, titleStyle) + 1;
            rowIndex = writeHeader(sheet, rowIndex, headerStyle, "Metric", "Value");
            writeRow(sheet, rowIndex++, textStyle, "Department Scope", report.getDepartmentName());
            writeRow(sheet, rowIndex++, textStyle, "Position", report.getPositionName());
            writeRow(sheet, rowIndex++, textStyle, "Period Start", formatExcelDate(report.getPeriodStart()));
            writeRow(sheet, rowIndex++, textStyle, "Period End", formatExcelDate(report.getPeriodEnd()));
            writeRow(sheet, rowIndex++, textStyle, "Total PIPs", report.getTotalPips());
            writeRow(sheet, rowIndex++, textStyle, "Total Employees", report.getTotalEmployees());
            writeRow(sheet, rowIndex++, textStyle, "Active PIPs", report.getActivePips());
            writeRow(sheet, rowIndex++, textStyle, "Completed PIPs", report.getCompletedPips());
            writeRow(sheet, rowIndex++, textStyle, "Closed PIPs", report.getClosedPips());
            writeRow(sheet, rowIndex++, textStyle, "Auto Closed PIPs", report.getAutoClosedPips());
            writeRow(sheet, rowIndex++, textStyle, "Average Progress %", report.getAverageProgress());
            writeRow(sheet, rowIndex++, textStyle, "Total Hours", report.getTotalPlannedHours());
            writeRow(sheet, rowIndex++, textStyle, "Total Completed Hours", report.getTotalCompletedHours());
            writeRow(sheet, rowIndex, textStyle, "Hours Completion %", report.getHoursCompletionPercentage());

            autosize(sheet, 2);
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate PIP progress Excel report", e);
        }
    }

    public void generatePdfReport(Object jasperPrint, OutputStream outputStream) {
        log.debug("Generating PDF report...");
        try {
            Class<?> jasperPrintClass = Class.forName("net.sf.jasperreports.engine.JasperPrint");
            Class<?> exportManagerClass = Class.forName("net.sf.jasperreports.engine.JasperExportManager");
            exportManagerClass
                    .getMethod("exportReportToPdfStream", jasperPrintClass, OutputStream.class)
                    .invoke(null, jasperPrint, outputStream);
            log.debug("PDF report generated successfully");
        } catch (ReflectiveOperationException e) {
            log.error("Failed to generate PDF report: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to generate PDF report", e);
        }
    }

    public void generateExcelReport(Object jasperPrint, OutputStream outputStream) {
        log.debug("Generating Excel report...");
        try {
            Class<?> jasperPrintClass = Class.forName("net.sf.jasperreports.engine.JasperPrint");
            Class<?> exporterClass = Class.forName("net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter");
            Class<?> exporterInputClass = Class.forName("net.sf.jasperreports.export.ExporterInput");
            Class<?> exporterOutputClass = Class.forName("net.sf.jasperreports.export.ExporterOutput");
            Class<?> reportExportConfigurationClass = Class
                    .forName("net.sf.jasperreports.export.ReportExportConfiguration");
            Class<?> simpleExporterInputClass = Class.forName("net.sf.jasperreports.export.SimpleExporterInput");
            Class<?> simpleOutputClass = Class.forName("net.sf.jasperreports.export.SimpleOutputStreamExporterOutput");
            Class<?> xlsxConfigurationClass = Class
                    .forName("net.sf.jasperreports.export.SimpleXlsxReportConfiguration");

            Object exporter = exporterClass.getConstructor().newInstance();
            Object exporterInput = simpleExporterInputClass.getConstructor(jasperPrintClass).newInstance(jasperPrint);
            Object exporterOutput = simpleOutputClass.getConstructor(OutputStream.class).newInstance(outputStream);
            Object configuration = xlsxConfigurationClass.getConstructor().newInstance();

            xlsxConfigurationClass.getMethod("setOnePagePerSheet", Boolean.class).invoke(configuration, Boolean.FALSE);
            xlsxConfigurationClass.getMethod("setDetectCellType", Boolean.class).invoke(configuration, Boolean.TRUE);
            xlsxConfigurationClass.getMethod("setCollapseRowSpan", Boolean.class).invoke(configuration, Boolean.FALSE);
            xlsxConfigurationClass.getMethod("setWhitePageBackground", Boolean.class).invoke(configuration,
                    Boolean.FALSE);

            exporterClass.getMethod("setExporterInput", exporterInputClass).invoke(exporter, exporterInput);
            exporterClass.getMethod("setExporterOutput", exporterOutputClass).invoke(exporter, exporterOutput);
            exporterClass.getMethod("setConfiguration", reportExportConfigurationClass).invoke(exporter, configuration);
            exporterClass.getMethod("exportReport").invoke(exporter);
            log.debug("Excel report generated successfully");
        } catch (ReflectiveOperationException e) {
            log.error("Failed to generate Excel report: {}", e.getMessage(), e);
            throw new IllegalStateException("Failed to generate Excel report", e);
        }
    }

    private byte[] export(Object jasperPrint, String format) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            generatePdfReport(jasperPrint, outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to write report output", e);
        }
    }

    private boolean isExcelFormat(String format) {
        return FORMAT_EXCEL.equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format);
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createTextStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setVerticalAlignment(VerticalAlignment.TOP);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createSummaryStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.DOUBLE);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private int writeTitle(Sheet sheet, int rowIndex, String title, int lastColumn, CellStyle style) {
        Row row = sheet.createRow(rowIndex++);
        Cell cell = row.createCell(0);
        cell.setCellValue(title);
        cell.setCellStyle(style);
        sheet.addMergedRegion(new CellRangeAddress(row.getRowNum(), row.getRowNum(), 0, lastColumn));
        return rowIndex;
    }

    private int writeHeader(Sheet sheet, int rowIndex, CellStyle style, String... headers) {
        Row row = sheet.createRow(rowIndex++);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
        return rowIndex;
    }

    private void writeRow(Sheet sheet, int rowIndex, CellStyle style, Object... values) {
        Row row = sheet.createRow(rowIndex);
        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellStyle(style);
            setCellValue(cell, values[i]);
        }
    }

    private void writeSummaryCountRow(Sheet sheet, int rowIndex, CellStyle style, int columnCount, String label,
            int count) {
        Row row = sheet.createRow(rowIndex);
        for (int i = 0; i < columnCount; i++) {
            Cell cell = row.createCell(i);
            cell.setCellStyle(style);
            if (i == columnCount - 2) {
                cell.setCellValue(label);
            } else if (i == columnCount - 1) {
                cell.setCellValue(count);
            }
        }
    }

    private void writeEmptyRow(Sheet sheet, int rowIndex, CellStyle style, int columnCount, String message) {
        Row row = sheet.createRow(rowIndex);
        Cell cell = row.createCell(0);
        cell.setCellStyle(style);
        cell.setCellValue(message);
        if (columnCount > 1) {
            sheet.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 0, columnCount - 1));
        }
    }

    private void setCellValue(Cell cell, Object value) {
        if (value == null) {
            cell.setBlank();
        } else if (value instanceof Number number) {
            cell.setCellValue(number.doubleValue());
        } else if (value instanceof Boolean bool) {
            cell.setCellValue(bool);
        } else {
            cell.setCellValue(value.toString());
        }
    }

    private void autosize(Sheet sheet, int columnCount) {
        for (int i = 0; i < columnCount; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1024, 16000));
        }
    }

    private String formatExcelDate(LocalDate date) {
        return date == null ? "" : DATE_FORMAT.format(date);
    }

    private String formatExcelDateTime(java.time.LocalDateTime dateTime) {
        return dateTime == null ? "" : DATE_TIME_FORMAT.format(dateTime);
    }

    private String formatGeneratedAt() {
        return GENERATED_AT_FORMAT.format(Instant.now().atZone(ZoneId.systemDefault()));
    }

    private Object fillReport(String templateName, List<?> rows, Map<String, Object> parameters) {
        log.debug("Filling report template: {}, rows count: {}", templateName, rows.size());
        try (InputStream inputStream = resolveTemplate(templateName).getInputStream()) {
            Class<?> compileManagerClass = Class.forName("net.sf.jasperreports.engine.JasperCompileManager");
            Class<?> fillManagerClass = Class.forName("net.sf.jasperreports.engine.JasperFillManager");
            Class<?> jasperReportClass = Class.forName("net.sf.jasperreports.engine.JasperReport");
            Class<?> jrDataSourceClass = Class.forName("net.sf.jasperreports.engine.JRDataSource");
            Class<?> beanDataSourceClass = Class.forName("net.sf.jasperreports.engine.data.JRBeanCollectionDataSource");

            log.debug("Compiling JasperReport template: {}", templateName);
            Object jasperReport = compileManagerClass
                    .getMethod("compileReport", InputStream.class)
                    .invoke(null, inputStream);
            Map<String, Object> reportParameters = new HashMap<>(parameters);
            reportParameters.put("COMPANY_LOGO", "");
            Object dataSource = beanDataSourceClass
                    .getConstructor(Collection.class)
                    .newInstance(rows == null ? List.of() : rows);
            log.debug("Filling report with data...");
            return fillManagerClass
                    .getMethod("fillReport", jasperReportClass, Map.class, jrDataSourceClass)
                    .invoke(null, jasperReport, reportParameters, dataSource);
        } catch (ReflectiveOperationException | IOException e) {
            log.error("Failed to fill report template {}: {}", templateName, e.getMessage(), e);
            throw new IllegalStateException("Failed to build report from template " + templateName, e);
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

    private PipIndividualReportDto toIndividualDto(Pip pip, List<PipProgressUpdate> progressUpdates) {
        List<PipIndividualReportDto.ObjectiveRow> objectives = safeList(pip.getObjectives()).stream()
                .map(this::toObjectiveRow)
                .toList();
        List<PipIndividualReportDto.MeetingRow> meetings = safeList(pip.getFollowUpMeetings()).stream()
                .sorted(Comparator.comparing(FollowUpMeeting::getScheduledDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toMeetingRow)
                .toList();
        List<PipIndividualReportDto.ProgressUpdateRow> updates = safeList(progressUpdates).stream()
                .map(this::toProgressUpdateRow)
                .toList();

        Employee employee = pip.getEmployee();
        Employee manager = pip.getManager();
        return new PipIndividualReportDto(
                pip.getId(),
                employee == null ? "" : employee.getEmployeeId(),
                employee == null ? "" : employee.getEmployeeName(),
                departmentName(employee),
                positionName(employee),
                manager == null ? "" : manager.getEmployeeName(),
                departmentName(manager),
                pipService.getLatestKpiTotalScore(employee),
                formatReportStatus(pip.getStatus()),
                pip.getStartDate(),
                pip.getEndDate(),
                pip.getOriginalEndDate(),
                pip.getActualEndDate(),
                pip.getTotalHours(),
                pip.getCompletedHours(),
                pip.getOverallProgressPercentage(),
                defaultText(pip.getReasonForPlan()),
                defaultText(pip.getExpectedImprovements()),
                defaultText(pip.getFinalOutcome()),
                defaultText(pip.getClosingRemarks()),
                pip.getEmployeeSignedAt(),
                pip.getManagerSignedAt(),
                getSignatureOrDefault(pip.getEmployeeSignature()),
                getSignatureOrDefault(pip.getManagerSignature()),
                toObjectiveSummary(objectives),
                toMeetingSummary(meetings),
                toProgressUpdateSummary(updates),
                objectives,
                meetings,
                updates);
    }

    private PipSummaryReportDto toSummaryDto(Pip pip) {
        Employee employee = pip.getEmployee();
        Employee manager = pip.getManager();
        List<PipIndividualReportDto.MeetingRow> meetings = safeList(pip.getFollowUpMeetings()).stream()
                .sorted(Comparator.comparing(FollowUpMeeting::getScheduledDate,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toMeetingRow)
                .toList();
        return new PipSummaryReportDto(
                pip.getId(),
                employee == null ? "" : employee.getEmployeeId(),
                employee == null ? "" : employee.getEmployeeName(),
                departmentName(employee),
                positionName(employee),
                manager == null ? "" : manager.getEmployeeName(),
                pipService.getLatestKpiTotalScore(employee),
                formatReportStatus(pip.getStatus()),
                pip.getStartDate(),
                pip.getEndDate(),
                pip.getOverallProgressPercentage(),
                pip.getTotalHours(),
                pip.getCompletedHours(),
                safeList(pip.getObjectives()).size(),
                meetings.size(),
                defaultText(pip.getFinalOutcome()),
                toMeetingSummary(meetings));
    }

    private PipProgressReportDto toProgressDto(List<Pip> pips, Long departmentId, LocalDate startDate,
            LocalDate endDate, User actor) {
        if (pips == null)
            pips = List.of();
        long totalPips = pips.size();
        long totalEmployees = pips.stream()
                .map(Pip::getEmployee)
                .filter(employee -> employee != null && employee.getId() != null)
                .map(Employee::getId)
                .distinct()
                .count();
        int totalHours = pips.stream()
                .map(Pip::getTotalHours)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();
        int completedHours = pips.stream()
                .map(Pip::getCompletedHours)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        BigDecimal averageProgress = totalPips == 0 ? BigDecimal.ZERO
                : pips.stream()
                        .map(Pip::getOverallProgressPercentage)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(totalPips), 2, RoundingMode.HALF_UP);
        BigDecimal hoursCompletion = totalHours == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(completedHours)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalHours), 2, RoundingMode.HALF_UP);

        return new PipProgressReportDto(
                resolveDepartmentScope(pips, departmentId, actor),
                getManagerPositionName(actor),
                startDate,
                endDate,
                totalEmployees,
                totalPips,
                countByStatus(pips, "ACTIVE"),
                countByStatus(pips, "COMPLETED"),
                countByStatus(pips, "CLOSED"),
                countByStatus(pips, "AUTO_CLOSED"),
                countByStatus(pips, "REOPEN_REQUESTED"),
                averageProgress,
                totalHours,
                completedHours,
                hoursCompletion);
    }

    private PipIndividualReportDto.ObjectiveRow toObjectiveRow(PipObjective objective) {
        return new PipIndividualReportDto.ObjectiveRow(
                objective.getId(),
                defaultText(objective.getDescription()),
                objective.getWeightPercentage(),
                objective.getProgressPercentage(),
                objective.getDueDate(),
                objective.getStatus());
    }

    private PipIndividualReportDto.MeetingRow toMeetingRow(FollowUpMeeting meeting) {
        return new PipIndividualReportDto.MeetingRow(
                meeting.getId(),
                meeting.getScheduledDate(),
                meeting.getMeetingTime(),
                meeting.getEndMeetingTime(),
                meeting.getTotalHours(),
                defaultText(meeting.getStatus()),
                defaultText(meeting.getNotes()));
    }

    private PipIndividualReportDto.ProgressUpdateRow toProgressUpdateRow(PipProgressUpdate update) {
        return new PipIndividualReportDto.ProgressUpdateRow(
                update.getId(),
                update.getUpdateDate(),
                update.getObjective() == null ? "" : defaultText(update.getObjective().getDescription()),
                update.getPreviousPercentage(),
                update.getNewPercentage(),
                defaultText(update.getFeedback()),
                update.getUpdatedBy() == null ? "" : update.getUpdatedBy().getEmployeeName(),
                update.getCreatedDate(),
                update.getCompletedHours());
    }

    private String toObjectiveSummary(List<PipIndividualReportDto.ObjectiveRow> objectives) {
        if (objectives.isEmpty()) {
            return "No objectives recorded.";
        }
        return objectives.stream()
                .map(row -> "- " + row.getDescription() + " | Progress: " + nullSafe(row.getProgressPercentage())
                        + "% | Due: " + format(row.getDueDate()))
                .collect(Collectors.joining("\n"));
    }

    private String toMeetingSummary(List<PipIndividualReportDto.MeetingRow> meetings) {
        if (meetings.isEmpty()) {
            return "No follow-up meetings recorded.";
        }
        return meetings.stream()
                .map(row -> "- " + formatExcelDateTime(row.getMeetingTime()) + " to "
                        + formatExcelDateTime(row.getEndMeetingTime()) + " | Total Hours: "
                        + nullSafe(row.getTotalHours()) + " | " + row.getStatus() + " | "
                        + row.getNotes())
                .collect(Collectors.joining("\n"));
    }

    private String toProgressUpdateSummary(List<PipIndividualReportDto.ProgressUpdateRow> updates) {
        if (updates.isEmpty()) {
            return "No progress updates recorded.";
        }
        return updates.stream()
                .map(row -> "- " + format(row.getUpdateDate()) + " | " + row.getObjectiveDescription()
                        + " | " + nullSafe(row.getPreviousPercentage()) + "% to " + nullSafe(row.getNewPercentage())
                        + "% | Updated by: " + row.getUpdatedBy()
                        + " | Progress feedback: "
                        + (row.getFeedback() == null || row.getFeedback().isBlank() ? "No feedback."
                                : row.getFeedback())
                        + (row.getCompletedHours() != null ? " | Completed Hours: " + row.getCompletedHours() : ""))
                .collect(Collectors.joining("\n"));
    }

    private String resolveDepartmentDisplay(Long departmentId, User actor) {
        if (departmentId != null) {
            return departmentRepository.findById(departmentId)
                    .map(Department::getName)
                    .orElse("Department #" + departmentId);
        }
        if (actor != null && actor.getEmployee() != null && actor.getEmployee().getDepartment() != null) {
            return actor.getEmployee().getDepartment().getName();
        }
        return "All";
    }

    private String getManagerPositionName(User actor) {
        if (actor == null || actor.getEmployee() == null) {
            return "";
        }
        Employee emp = actor.getEmployee();
        if (emp.getDepartmentPosition() != null && emp.getDepartmentPosition().getPosition() != null) {
            return emp.getDepartmentPosition().getPosition().getName();
        }
        if (emp.getPosition() != null) {
            return emp.getPosition().getName();
        }
        return "";
    }

    private List<Pip> filterReportPips(String status, Long departmentId, Long positionId, String employeeName,
            Long employeeId, Long pipId, LocalDate startDate, LocalDate endDate, User actor) {
        return pipService.searchPips(departmentId, positionId, pipId, employeeName, status, startDate, endDate, actor)
                .stream()
                .filter(pip -> employeeId == null
                        || (pip.getEmployee() != null && pip.getEmployee().getId() != null
                                && pip.getEmployee().getId().equals(employeeId)))
                .toList();
    }

    private String buildFilterDescription(String status, Long departmentId, Long positionId, String employeeName,
            Long employeeId, Long pipId, LocalDate startDate, LocalDate endDate, User actor) {
        return "Status: " + (status == null || status.isBlank() ? "All" : formatReportStatus(status))
                + " | Department: " + resolveDepartmentDisplay(departmentId, actor)
                + " | Position: " + resolvePositionDisplay(positionId)
                + " | Employee Name: " + (employeeName == null || employeeName.isBlank() ? "All" : employeeName.trim())
                + " | Employee: " + (employeeId == null ? "All" : "Employee #" + employeeId)
                + " | PIP: " + (pipId == null ? "All" : "PIP #" + pipId)
                + " | Start: " + format(startDate)
                + " | End: " + format(endDate);
    }

    private String resolvePositionDisplay(Long positionId) {
        return positionId == null ? "All" : "Position #" + positionId;
    }

    private long countByStatus(List<Pip> pips, String status) {
        return pips.stream()
                .filter(pip -> status.equalsIgnoreCase(pip.getStatus()))
                .count();
    }

    private String formatReportStatus(String status) {
        if (status == null || status.isBlank()) {
            return "";
        }
        String normalized = status.trim().toUpperCase(Locale.ENGLISH).replaceAll("\\s+", "_");
        if ("REOPEN_REQUESTED".equals(normalized) || "PENDING_REOPEN".equals(normalized)) {
            return "ACTIVE";
        }
        if ("DENIED".equals(normalized)) {
            return "CLOSED";
        }
        return normalized;
    }

    private long countDistinctEmployees(List<PipSummaryReportDto> rows) {
        return rows.stream()
                .map(row -> row.getEmployeeStaffNo() == null || row.getEmployeeStaffNo().isBlank()
                        ? row.getEmployeeName()
                        : row.getEmployeeStaffNo())
                .filter(value -> value != null && !value.isBlank())
                .distinct()
                .count();
    }

    private String resolveDepartmentScope(List<Pip> pips, Long departmentId, User actor) {
        if (departmentId != null) {
            return departmentRepository.findById(departmentId)
                    .map(Department::getName)
                    .orElse("Department #" + departmentId);
        }

        if (pips.isEmpty()) {
            if (actor != null && actor.getEmployee() != null && actor.getEmployee().getDepartment() != null) {
                String roleName = actor.getRole() != null ? actor.getRole().getName().trim().toUpperCase() : "";
                if (!"HR".equals(roleName) && !"ADMIN".equals(roleName) && !"SUPER_ADMIN".equals(roleName)) {
                    return actor.getEmployee().getDepartment().getName();
                }
            }
            return "All accessible departments";
        }

        List<String> names = pips.stream()
                .map(Pip::getEmployee)
                .map(this::departmentName)
                .filter(name -> !name.isBlank())
                .distinct()
                .toList();

        return names.size() == 1 ? names.get(0) : "Multiple departments";
    }

    private String departmentName(Employee employee) {
        return employee == null || employee.getDepartment() == null ? ""
                : defaultText(employee.getDepartment().getName());
    }

    private String positionName(Employee employee) {
        return employee == null || employee.getPosition() == null ? "" : defaultText(employee.getPosition().getName());
    }

    private String format(LocalDate date) {
        return date == null ? "All" : DATE_FORMAT.format(date);
    }

    private String defaultText(String value) {
        return value == null || value.isBlank() ? "" : value.trim();
    }

    private String getSignatureOrDefault(String storedSignature) {
        if (storedSignature != null && !storedSignature.isBlank()) {
            String signature = storedSignature.trim();
            if (signature.startsWith("data:")) {
                return signature;
            }
            if (signature.startsWith("/uploads/") || signature.startsWith("uploads/")) {
                String base64 = convertFilePathToBase64(signature);
                if (base64 != null) {
                    return base64;
                }
            }
            return signature;
        }
        return "Not signed";
    }

    private String convertFilePathToBase64(String filePath) {
        try {
            Path path = resolveSignaturePath(filePath);
            if (!Files.exists(path)) {
                log.warn("Signature file not found: {}", path);
                return null;
            }
            byte[] bytes = Files.readAllBytes(path);
            return "data:" + mimeTypeFor(path) + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (IOException e) {
            log.error("Failed to read signature file: {}", filePath, e);
            return null;
        }
    }

    private Path resolveSignaturePath(String filePath) {
        String normalizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
        String publicPrefix = "uploads/signatures/";
        if (normalizedPath.startsWith(publicPrefix)) {
            String filename = normalizedPath.substring(publicPrefix.length());
            return Path.of(signatureUploadDir).toAbsolutePath().normalize().resolve(filename).normalize();
        }
        return Path.of(normalizedPath).toAbsolutePath().normalize();
    }

    private String mimeTypeFor(Path path) throws IOException {
        String detected = Files.probeContentType(path);
        if (detected != null && !detected.isBlank()) {
            return detected;
        }
        String filename = path.getFileName() == null ? "" : path.getFileName().toString().toLowerCase(Locale.ENGLISH);
        if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
        if (filename.endsWith(".gif")) return "image/gif";
        if (filename.endsWith(".webp")) return "image/webp";
        if (filename.endsWith(".bmp")) return "image/bmp";
        if (filename.endsWith(".svg")) return "image/svg+xml";
        return "image/png";
    }

    private String nullSafe(Integer value) {
        return value == null ? "0" : value.toString();
    }

    private String nullSafe(Double value) {
        return value == null ? "0" : value.toString();
    }

    private <T> List<T> safeList(List<T> items) {
        return items == null ? List.of() : items;
    }
}
