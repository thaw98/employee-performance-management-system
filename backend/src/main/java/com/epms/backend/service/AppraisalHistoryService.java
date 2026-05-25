package com.epms.backend.service;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.appraisal.AppraisalHistoryDetailRowDto;
import com.epms.backend.dto.appraisal.AppraisalHistorySummaryRowDto;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalCycle;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.repository.AppraisalCycleRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppraisalHistoryService {

    private static final EnumSet<AppraisalStatus> HISTORY_STATUSES = EnumSet.of(
            AppraisalStatus.HR_APPROVED,
            AppraisalStatus.LOCKED);
    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd", Locale.ROOT)
            .withZone(ZoneId.systemDefault());

    private final AppraisalAssignmentRepository appraisalAssignmentRepository;
    private final AppraisalCycleRepository appraisalCycleRepository;

    @Transactional(readOnly = true)
    public List<AppraisalHistorySummaryRowDto> getHistory(Long employeeId, Long roleId) {
        List<AppraisalAssignment> scoped = getScopedHistoryAssignments(employeeId, roleId, null);
        return toSummaryRows(scoped);
    }

    @Transactional(readOnly = true)
    public byte[] exportCycleWorkbook(Long cycleId, Long employeeId, Long roleId) {
        AppraisalCycle cycle = appraisalCycleRepository.findById(cycleId)
                .orElseThrow(() -> new RuntimeException("Appraisal cycle not found"));
        List<AppraisalAssignment> scoped = getScopedHistoryAssignments(employeeId, roleId, cycleId);
        List<AppraisalHistorySummaryRowDto> summaryRows = toSummaryRows(scoped);
        List<AppraisalHistoryDetailRowDto> detailRows = scoped.stream()
                .map(this::toDetailRow)
                .toList();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            writeSummarySheet(workbook, cycle, summaryRows);
            writeDetailSheet(workbook, detailRows);
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate appraisal history workbook", e);
        }
    }

    public String buildExportFilename(Long cycleId) {
        return appraisalCycleRepository.findById(cycleId)
                .map(cycle -> "appraisal-history-" + safeFileName(cycle.getName()) + "-" + FILE_DATE.format(Instant.now()) + ".xlsx")
                .orElse("appraisal-history-" + cycleId + "-" + FILE_DATE.format(Instant.now()) + ".xlsx");
    }

    private List<AppraisalAssignment> getScopedHistoryAssignments(Long employeeId, Long roleId, Long cycleId) {
        return appraisalAssignmentRepository.findAll().stream()
                .filter(this::isHistoryAssignment)
                .filter(a -> cycleId == null || (a.getPeriod() != null && cycleId.equals(a.getPeriod().getId())))
                .filter(a -> isRoleScoped(a, employeeId, roleId))
                .sorted(Comparator
                        .comparing((AppraisalAssignment a) -> a.getPeriod() != null ? a.getPeriod().getStartDate() : null,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(a -> safeLower(departmentName(a)))
                        .thenComparing(a -> safeLower(positionName(a)))
                        .thenComparing(a -> safeLower(employeeName(a))))
                .toList();
    }

    private boolean isHistoryAssignment(AppraisalAssignment assignment) {
        return assignment != null
                && assignment.getStatus() != null
                && HISTORY_STATUSES.contains(assignment.getStatus())
                && !isProbationEmployee(assignment);
    }

    private boolean isRoleScoped(AppraisalAssignment assignment, Long employeeId, Long roleId) {
        if (roleId != null && roleId == 1L) {
            return true;
        }
        Employee employee = assignment.getEmployee();
        if (employee == null || employeeId == null) {
            return false;
        }
        if (roleId != null && roleId == 2L) {
            Long evaluatorId = assignment.getEvaluator() != null ? assignment.getEvaluator().getId() : null;
            boolean isEvaluator = employeeId.equals(evaluatorId);
            boolean isDirectReport = employee.getManager() != null && employeeId.equals(employee.getManager().getId());
            boolean isDepartmentManaged = employee.getDepartment() != null
                    && employeeId.equals(employee.getDepartment().getManagerId());
            return isEvaluator || isDirectReport || isDepartmentManaged;
        }
        if (roleId != null && roleId == 4L) {
            return employeeId.equals(employee.getId());
        }
        return false;
    }

    private List<AppraisalHistorySummaryRowDto> toSummaryRows(List<AppraisalAssignment> assignments) {
        Map<HistoryGroupKey, List<AppraisalAssignment>> grouped = assignments.stream()
                .collect(Collectors.groupingBy(this::groupKey));

        return grouped.entrySet().stream()
                .map(entry -> toSummaryRow(entry.getKey(), entry.getValue()))
                .sorted(Comparator
                        .comparing(AppraisalHistorySummaryRowDto::cycleStartDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(row -> safeLower(row.departmentName()))
                        .thenComparing(row -> safeLower(row.positionName())))
                .toList();
    }

    private AppraisalHistorySummaryRowDto toSummaryRow(HistoryGroupKey key, List<AppraisalAssignment> rows) {
        long approved = rows.stream().filter(a -> a.getStatus() == AppraisalStatus.HR_APPROVED).count();
        long finalized = rows.stream().filter(a -> a.getStatus() == AppraisalStatus.LOCKED).count();
        double average = rows.stream()
                .map(AppraisalAssignment::getTotalScore)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
        return new AppraisalHistorySummaryRowDto(
                key.cycleId(),
                key.cycleName(),
                key.cycleStartDate(),
                key.cycleEndDate(),
                key.departmentId(),
                key.departmentName(),
                key.positionId(),
                key.positionName(),
                rows.size(),
                approved,
                finalized,
                average);
    }

    private HistoryGroupKey groupKey(AppraisalAssignment assignment) {
        AppraisalCycle cycle = assignment.getPeriod();
        Employee employee = assignment.getEmployee();
        Department department = employee != null ? employee.getDepartment() : null;
        Position position = employee != null ? employee.getPosition() : null;
        return new HistoryGroupKey(
                cycle != null ? cycle.getId() : null,
                cycle != null ? cycle.getName() : "Unassigned Cycle",
                cycle != null ? cycle.getStartDate() : null,
                cycle != null ? cycle.getEndDate() : null,
                department != null ? department.getId() : null,
                department != null ? department.getName() : "Unassigned Department",
                position != null ? position.getId() : null,
                position != null ? position.getName() : "Unassigned Position");
    }

    private AppraisalHistoryDetailRowDto toDetailRow(AppraisalAssignment assignment) {
        AppraisalCycle cycle = assignment.getPeriod();
        Employee employee = assignment.getEmployee();
        Department department = employee != null ? employee.getDepartment() : null;
        Position position = employee != null ? employee.getPosition() : null;
        return new AppraisalHistoryDetailRowDto(
                assignment.getId(),
                cycle != null ? cycle.getId() : null,
                cycle != null ? cycle.getName() : null,
                cycle != null ? cycle.getStartDate() : null,
                cycle != null ? cycle.getEndDate() : null,
                department != null ? department.getId() : null,
                department != null ? department.getName() : null,
                position != null ? position.getId() : null,
                position != null ? position.getName() : null,
                employee != null ? employee.getId() : null,
                employee != null ? employee.getEmployeeId() : null,
                employee != null ? employee.getEmployeeName() : null,
                assignment.getStatus().name(),
                displayStatus(assignment.getStatus()),
                assignment.getTotalScore(),
                assignment.getRatingCategory(),
                assignment.getSubmittedAt(),
                assignment.getHrSignedAt(),
                assignment.getStatus() == AppraisalStatus.LOCKED ? assignment.getUpdatedAt() : null);
    }

    private void writeSummarySheet(Workbook workbook, AppraisalCycle cycle, List<AppraisalHistorySummaryRowDto> rows) {
        Sheet sheet = workbook.createSheet("Cycle Summary");
        CellStyle header = headerStyle(workbook);
        CellStyle dateStyle = dateStyle(workbook);

        Row title = sheet.createRow(0);
        title.createCell(0).setCellValue("Appraisal History");
        Row cycleRow = sheet.createRow(1);
        cycleRow.createCell(0).setCellValue("Cycle");
        cycleRow.createCell(1).setCellValue(nullToBlank(cycle.getName()));
        cycleRow.createCell(2).setCellValue("Start Date");
        setLocalDate(cycleRow.createCell(3), cycle.getStartDate(), dateStyle);
        cycleRow.createCell(4).setCellValue("End Date");
        setLocalDate(cycleRow.createCell(5), cycle.getEndDate(), dateStyle);

        String[] headers = {
                "Cycle Name", "Start Date", "End Date", "Department", "Position",
                "Total", "HR Approved", "Finalized", "Average Score"
        };
        Row headerRow = sheet.createRow(3);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(header);
        }

        int rowIndex = 4;
        for (AppraisalHistorySummaryRowDto row : rows) {
            Row excelRow = sheet.createRow(rowIndex++);
            excelRow.createCell(0).setCellValue(nullToBlank(row.cycleName()));
            setLocalDate(excelRow.createCell(1), row.cycleStartDate(), dateStyle);
            setLocalDate(excelRow.createCell(2), row.cycleEndDate(), dateStyle);
            excelRow.createCell(3).setCellValue(nullToBlank(row.departmentName()));
            excelRow.createCell(4).setCellValue(nullToBlank(row.positionName()));
            excelRow.createCell(5).setCellValue(row.totalCount());
            excelRow.createCell(6).setCellValue(row.hrApprovedCount());
            excelRow.createCell(7).setCellValue(row.finalizedCount());
            excelRow.createCell(8).setCellValue(row.averageScore() == null ? 0.0 : row.averageScore());
        }
        autoSize(sheet, headers.length);
    }

    private void writeDetailSheet(Workbook workbook, List<AppraisalHistoryDetailRowDto> rows) {
        Sheet sheet = workbook.createSheet("Employee Details");
        CellStyle header = headerStyle(workbook);
        CellStyle dateStyle = dateStyle(workbook);
        CellStyle instantStyle = instantStyle(workbook);
        String[] headers = {
                "Cycle Name", "Start Date", "End Date", "Department", "Position",
                "Employee ID", "Employee Name", "Status", "Score", "Rating Category",
                "Submitted Date", "HR Approved Date", "Finalized Date"
        };
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(header);
        }

        int rowIndex = 1;
        for (AppraisalHistoryDetailRowDto row : rows) {
            Row excelRow = sheet.createRow(rowIndex++);
            excelRow.createCell(0).setCellValue(nullToBlank(row.cycleName()));
            setLocalDate(excelRow.createCell(1), row.cycleStartDate(), dateStyle);
            setLocalDate(excelRow.createCell(2), row.cycleEndDate(), dateStyle);
            excelRow.createCell(3).setCellValue(nullToBlank(row.departmentName()));
            excelRow.createCell(4).setCellValue(nullToBlank(row.positionName()));
            excelRow.createCell(5).setCellValue(nullToBlank(row.employeeId()));
            excelRow.createCell(6).setCellValue(nullToBlank(row.employeeName()));
            excelRow.createCell(7).setCellValue(nullToBlank(row.statusLabel()));
            excelRow.createCell(8).setCellValue(row.score() == null ? 0.0 : row.score());
            excelRow.createCell(9).setCellValue(nullToBlank(row.ratingCategory()));
            setInstant(excelRow.createCell(10), row.submittedDate(), instantStyle);
            setInstant(excelRow.createCell(11), row.hrApprovedDate(), instantStyle);
            setInstant(excelRow.createCell(12), row.finalizedDate(), instantStyle);
        }
        autoSize(sheet, headers.length);
    }

    private CellStyle headerStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle dateStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper helper = workbook.getCreationHelper();
        style.setDataFormat(helper.createDataFormat().getFormat("yyyy-mm-dd"));
        return style;
    }

    private CellStyle instantStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper helper = workbook.getCreationHelper();
        style.setDataFormat(helper.createDataFormat().getFormat("yyyy-mm-dd hh:mm"));
        return style;
    }

    private void setLocalDate(Cell cell, java.time.LocalDate value, CellStyle style) {
        if (value == null) {
            cell.setCellValue("");
            return;
        }
        cell.setCellValue(java.sql.Date.valueOf(value));
        cell.setCellStyle(style);
    }

    private void setInstant(Cell cell, Instant value, CellStyle style) {
        if (value == null) {
            cell.setCellValue("");
            return;
        }
        cell.setCellValue(java.util.Date.from(value));
        cell.setCellStyle(style);
    }

    private void autoSize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private String displayStatus(AppraisalStatus status) {
        if (status == AppraisalStatus.LOCKED) {
            return "Finalized";
        }
        if (status == AppraisalStatus.HR_APPROVED) {
            return "HR Approved";
        }
        return status == null ? "" : status.name().replace('_', ' ');
    }

    private boolean isProbationEmployee(AppraisalAssignment assignment) {
        return assignment != null
                && assignment.getEmployee() != null
                && assignment.getEmployee().getStaffType() != null
                && assignment.getEmployee().getStaffType().getId() == StaffTypes.PROBATION;
    }

    private String departmentName(AppraisalAssignment assignment) {
        Employee employee = assignment.getEmployee();
        return employee != null && employee.getDepartment() != null ? employee.getDepartment().getName() : "";
    }

    private String positionName(AppraisalAssignment assignment) {
        Employee employee = assignment.getEmployee();
        return employee != null && employee.getPosition() != null ? employee.getPosition().getName() : "";
    }

    private String employeeName(AppraisalAssignment assignment) {
        Employee employee = assignment.getEmployee();
        return employee != null ? employee.getEmployeeName() : "";
    }

    private String safeLower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private String safeFileName(String value) {
        String normalized = value == null || value.isBlank() ? "cycle" : value.trim().toLowerCase(Locale.ROOT);
        return normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private record HistoryGroupKey(
            Long cycleId,
            String cycleName,
            java.time.LocalDate cycleStartDate,
            java.time.LocalDate cycleEndDate,
            Long departmentId,
            String departmentName,
            Long positionId,
            String positionName) {
    }
}
