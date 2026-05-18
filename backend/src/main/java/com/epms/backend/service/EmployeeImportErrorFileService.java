package com.epms.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.epms.backend.dto.hr.EmployeeImportRowErrorDto;

@Service
public class EmployeeImportErrorFileService {

    @Value("${epms.import.error-file-dir:${java.io.tmpdir}/epms-import-errors}")
    private String errorFileDir;

    private static final String[] HEADERS = {
            "Row#", "staff_no", "title", "full_name", "staff_nrc_no", "email", "department", "position",
            "phone_number", "gender", "date_of_birth", "hire_date", "staff_type",
            "probation_start_date", "probation_end_date",
            "address", "race", "employment_status", "religion",
            "emergency_contact_relationship", "emergency_contact_phone",
            "father_name", "father_nrc_no", "father_occupation",
            "marital_status", "spouse_name", "spouse_nrc",
            "profile_picture_url",
            "Errors"
    };

    public byte[] generateErrorFile(List<EmployeeImportRowErrorDto> invalidItems) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Errors");

            CellStyle headerStyle = wb.createCellStyle();
            Font hFont = wb.createFont();
            hFont.setBold(true);
            hFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(hFont);
            headerStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(HEADERS[i]);
                c.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, i == HEADERS.length - 1 ? 15000 : 5000);
            }

            CellStyle errorCellStyle = wb.createCellStyle();
            errorCellStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            errorCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            int rowIdx = 1;
            for (EmployeeImportRowErrorDto inv : invalidItems) {
                Row row = sheet.createRow(rowIdx++);
                Map<String, Object> rd = inv.getRowData();
                row.createCell(0).setCellValue(inv.getRowNumber() != null ? inv.getRowNumber() : rowIdx);
                row.createCell(1).setCellValue(strOrEmpty(rd, "staffNo"));
                row.createCell(2).setCellValue(strOrEmpty(rd, "title"));
                row.createCell(3).setCellValue(strOrEmpty(rd, "fullName"));
                row.createCell(4).setCellValue(strOrEmpty(rd, "staffNrcNo"));
                row.createCell(5).setCellValue(strOrEmpty(rd, "email"));
                row.createCell(6).setCellValue(strOrEmpty(rd, "department"));
                row.createCell(7).setCellValue(strOrEmpty(rd, "position"));
                row.createCell(8).setCellValue(strOrEmpty(rd, "phoneNumber"));
                row.createCell(9).setCellValue(strOrEmpty(rd, "gender"));
                row.createCell(10).setCellValue(strOrEmpty(rd, "dateOfBirth"));
                row.createCell(11).setCellValue(strOrEmpty(rd, "hireDate"));
                row.createCell(12).setCellValue(strOrEmpty(rd, "staffType"));
                row.createCell(13).setCellValue(strOrEmpty(rd, "probationStartDate"));
                row.createCell(14).setCellValue(strOrEmpty(rd, "probationEndDate"));
                row.createCell(15).setCellValue(strOrEmpty(rd, "address"));
                row.createCell(16).setCellValue(strOrEmpty(rd, "race"));
                row.createCell(17).setCellValue(strOrEmpty(rd, "employmentStatus"));
                row.createCell(18).setCellValue(strOrEmpty(rd, "religion"));
                row.createCell(19).setCellValue(strOrEmpty(rd, "emergencyContactRelationship"));
                row.createCell(20).setCellValue(strOrEmpty(rd, "emergencyContactPhone"));
                row.createCell(21).setCellValue(strOrEmpty(rd, "fatherName"));
                row.createCell(22).setCellValue(strOrEmpty(rd, "fatherNrcNo"));
                row.createCell(23).setCellValue(strOrEmpty(rd, "fatherOccupation"));
                row.createCell(24).setCellValue(strOrEmpty(rd, "maritalStatus"));
                row.createCell(25).setCellValue(strOrEmpty(rd, "spouseName"));
                row.createCell(26).setCellValue(strOrEmpty(rd, "spouseNrc"));
                row.createCell(27).setCellValue(strOrEmpty(rd, "profilePictureUrl"));

                String errors = inv.getErrors() != null ? String.join("; ", inv.getErrors()) : "";
                Cell errCell = row.createCell(28);
                errCell.setCellValue(errors);
                errCell.setCellStyle(errorCellStyle);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate error file", e);
        }
    }

    public String saveErrorFile(String validationId, byte[] bytes) {
        try {
            Path dir = Paths.get(errorFileDir);
            Files.createDirectories(dir);
            String fileName = "import_errors_" + validationId + ".xlsx";
            Path filePath = dir.resolve(fileName);
            try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                fos.write(bytes);
            }
            return filePath.toString();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to save error file", e);
        }
    }

    public byte[] readErrorFile(String filePath) {
        try {
            return Files.readAllBytes(Paths.get(filePath));
        } catch (IOException e) {
            throw new IllegalStateException("Error file not found or could not be read", e);
        }
    }

    private String strOrEmpty(Map<String, Object> map, String key) {
        Object v = map == null ? null : map.get(key);
        return v == null ? "" : v.toString();
    }
}
