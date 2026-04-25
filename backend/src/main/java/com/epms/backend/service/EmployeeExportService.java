package com.epms.backend.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.StaffTypes;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.EmployeeReligion;
import com.epms.backend.entity.EmployeeStatus;
import com.epms.backend.repository.EmployeeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeExportService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy");
    private static final String[] EXPORT_ONLY_HEADERS = {
            "profile_picture_url",
            "staff_nrc_number",
            "emergency_contact_relation",
            "created_on",
            "updated_on"
    };
    private static final int IMPORT_TEMPLATE_HEADER_COUNT = 22;
    private static final int[] TEXT_COLUMNS = { 6, 8, 9, 11, 12, 18, 25, 26 };

    private final EmployeeRepository employeeRepository;
    private final EmployeeImportTemplateService templateService;

    @Transactional(readOnly = true)
    public byte[] exportEmployees() {
        List<Employee> employees = employeeRepository.findAllForExport();
        byte[] templateBytes = templateService.generateTemplate();

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(templateBytes));
                ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.getSheet("Employees");
            if (sheet == null) {
                sheet = workbook.createSheet("Employees");
            }

            Row headerRow = getOrCreateRow(sheet, 0);
            CellStyle headerStyle = resolveHeaderStyle(workbook, headerRow);
            appendExportHeaders(sheet, headerRow, headerStyle);
            removeSheetIfPresent(workbook, "Instructions");
            removeSheetIfPresent(workbook, "Sample Data");
            workbook.setActiveSheet(workbook.getSheetIndex(sheet));

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setDataFormat(workbook.createDataFormat().getFormat("@"));
            for (int col : TEXT_COLUMNS) {
                sheet.setDefaultColumnStyle(col, textStyle);
            }

            int rowIndex = 1;
            for (Employee employee : employees) {
                Row row = getOrCreateRow(sheet, rowIndex++);
                writeEmployeeRow(row, employee, textStyle);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to export employees", e);
        }
    }

    private void appendExportHeaders(Sheet sheet, Row headerRow, CellStyle headerStyle) {
        for (int i = 0; i < EXPORT_ONLY_HEADERS.length; i++) {
            int col = IMPORT_TEMPLATE_HEADER_COUNT + i;
            Cell cell = getOrCreateCell(headerRow, col);
            cell.setCellValue(EXPORT_ONLY_HEADERS[i]);
            if (headerStyle != null) {
                cell.setCellStyle(headerStyle);
            }
            sheet.setColumnWidth(col, i == 0 ? 9000 : 6500);
        }
    }

    private void writeEmployeeRow(Row row, Employee employee, CellStyle textStyle) {
        EmployeeProbation probation = employee.getProbation();

        write(row, 0, employee.getEmployeeId(), textStyle);
        write(row, 1, employee.getEmployeeName(), null);
        write(row, 2, employee.getStaffNrcNo(), null);
        write(row, 3, employee.getEmail(), null);
        write(row, 4, employee.getDepartment() != null ? employee.getDepartment().getName() : null, null);
        write(row, 5, employee.getPosition() != null ? employee.getPosition().getName() : null, null);
        write(row, 6, employee.getPhoneNo(), textStyle);
        write(row, 7, employee.getGender() != null ? employee.getGender().name() : null, null);
        write(row, 8, formatDate(employee.getDateOfBirth()), textStyle);
        write(row, 9, formatDate(employee.getDateOfJoining()), textStyle);
        write(row, 10, employee.getStaffType() != null ? employee.getStaffType().getName() : null, null);
        write(row, 11, probation != null ? formatDate(probation.getProbationStartDate()) : null, textStyle);
        write(row, 12, probation != null ? formatDate(probation.getProbationEndDate()) : null, textStyle);
        write(row, 13, employee.getAddress(), null);
        write(row, 14, employee.getNationality(), null);
        write(row, 15, determineEmploymentStatus(employee), null);
        write(row, 16, formatReligion(employee.getReligion()), null);
        write(row, 17, employee.getEmergencyContact() != null ? employee.getEmergencyContact().getRelation() : null, null);
        write(row, 18, employee.getEmergencyContact() != null ? employee.getEmergencyContact().getEmergencyPhone() : null, textStyle);
        write(row, 19, employee.getFather() != null ? employee.getFather().getFatherName() : null, null);
        write(row, 20, employee.getFather() != null ? employee.getFather().getFatherNrcNo() : null, null);
        write(row, 21, employee.getFather() != null ? employee.getFather().getFatherOccupation() : null, null);
        write(row, 22, employee.getProfilePictureUrl(), null);
        write(row, 23, employee.getStaffNrcNo(), null);
        write(row, 24, employee.getEmergencyContact() != null ? employee.getEmergencyContact().getRelation() : null, null);
        write(row, 25, formatInstantDate(employee.getCreatedDate()), textStyle);
        write(row, 26, formatInstantDate(employee.getUpdatedDate()), textStyle);
    }

    private void write(Row row, int columnIndex, String value, CellStyle style) {
        Cell cell = getOrCreateCell(row, columnIndex);
        cell.setCellValue(value == null ? "" : value);
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private String determineEmploymentStatus(Employee employee) {
        EmployeeStatus status = employee.getEmploymentStatus();
        if (status == EmployeeStatus.RESIGNED) {
            return "Resigned";
        }
        if (status == EmployeeStatus.TERMINATED) {
            return "Terminated";
        }
        if (employee.getStaffType() != null && employee.getStaffType().getId() == StaffTypes.PROBATION) {
            return "Probation";
        }
        return "Permanent";
    }

    private String formatReligion(EmployeeReligion religion) {
        return religion == null ? "" : religion.toApiLabel();
    }

    private String formatDate(LocalDate date) {
        return date == null ? "" : DATE_FORMAT.format(date);
    }

    private String formatInstantDate(Instant instant) {
        return instant == null ? "" : DATE_FORMAT.format(instant.atZone(ZoneId.systemDefault()).toLocalDate());
    }

    private Row getOrCreateRow(Sheet sheet, int rowIndex) {
        Row row = sheet.getRow(rowIndex);
        return row != null ? row : sheet.createRow(rowIndex);
    }

    private Cell getOrCreateCell(Row row, int columnIndex) {
        Cell cell = row.getCell(columnIndex);
        return cell != null ? cell : row.createCell(columnIndex);
    }

    private CellStyle resolveHeaderStyle(Workbook workbook, Row headerRow) {
        Cell firstHeaderCell = headerRow.getCell(0);
        if (firstHeaderCell == null || firstHeaderCell.getCellStyle() == null) {
            return null;
        }
        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.cloneStyleFrom(firstHeaderCell.getCellStyle());
        return headerStyle;
    }

    private void removeSheetIfPresent(Workbook workbook, String sheetName) {
        int sheetIndex = workbook.getSheetIndex(sheetName);
        if (sheetIndex >= 0) {
            workbook.removeSheetAt(sheetIndex);
        }
    }
}
