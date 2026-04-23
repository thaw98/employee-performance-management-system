// KpiExcelService.java - Fixed version
package com.epms.backend.service;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.KpiRecord;
import com.epms.backend.repository.EmployeeRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class KpiExcelService {
    
    private final EmployeeRepository employeeRepository;
    private final KpiService kpiService;

    // Ordered columns for standardized import/export
    private static final String[] COLUMNS = {
            "Employee ID", "Employee Name", "Period ID", "Period Name", "KPI Name", "Category",
            "Target", "Unit", "Weight (%)", "Logic Direction (higher/lower)", "Actual", "Remarks"
    };

    public KpiExcelService(EmployeeRepository employeeRepository, KpiService kpiService) {
        this.employeeRepository = employeeRepository;
        this.kpiService = kpiService;
    }

    /**
     * Generate an empty Excel template for bulk upload.
     */
    public ByteArrayInputStream generateTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("KPI Template");

            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            for (int col = 0; col < COLUMNS.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(COLUMNS[col]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(col, 5000);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate Excel template: " + e.getMessage());
        }
    }

    /**
     * Export existing KPIs with actuals to an Excel file.
     */
    public ByteArrayInputStream exportKpis(List<KpiRecord> records) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("KPI Export");

            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Export columns
            String[] exportCols = {
                    "Record ID", "Employee ID", "Employee Name", "Period ID", "Period Name", 
                    "KPI Name", "Category", "Target", "Unit", "Weight (%)", "Logic Direction", 
                    "Actual", "Score", "Weighted Score", "Status", "Remarks"
            };

            for (int col = 0; col < exportCols.length; col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(exportCols[col]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (KpiRecord r : records) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getId() != null ? r.getId().toString() : "");
                row.createCell(1).setCellValue(r.getEmployee().getId() != null ? r.getEmployee().getId().toString() : "");
                row.createCell(2).setCellValue(r.getEmployee().getEmployeeName());
                row.createCell(3).setCellValue(r.getPeriodId() != null ? r.getPeriodId().toString() : "");
                row.createCell(4).setCellValue(r.getPeriodName() != null ? r.getPeriodName() : "");
                row.createCell(5).setCellValue(r.getKpi() != null ? r.getKpi() : "");
                row.createCell(6).setCellValue(r.getCategory() != null ? r.getCategory() : "");
                row.createCell(7).setCellValue(r.getTarget() != null ? r.getTarget() : "");
                row.createCell(8).setCellValue(r.getUnit() != null ? r.getUnit() : "");
                row.createCell(9).setCellValue(r.getWeight() != null ? r.getWeight().doubleValue() : 0d);
                row.createCell(10).setCellValue(r.getLogicDirection() != null ? r.getLogicDirection() : "");
                row.createCell(11).setCellValue(r.getActual() != null ? r.getActual() : "");
                
                // Fix: Handle null scores properly
                double scoreValue = r.getScore() != null ? r.getScore().doubleValue() : 0.0;
                row.createCell(12).setCellValue(scoreValue);
                
                double weightedScoreValue = r.getWeightedScore() != null ? r.getWeightedScore().doubleValue() : 0.0;
                row.createCell(13).setCellValue(weightedScoreValue);
                
                row.createCell(14).setCellValue(r.getStatus() != null ? r.getStatus().name() : "");
                row.createCell(15).setCellValue(r.getRemarks() != null ? r.getRemarks() : "");
            }

            for (int i = 0; i < exportCols.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to export KPIs: " + e.getMessage());
        }
    }

    /**
     * Import KPI data from an uploaded Excel file.
     */
    public List<KpiRecord> importKpiData(MultipartFile file, String actorName) {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            List<KpiRecord> importedRecords = new ArrayList<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                // Validate required columns
                String empIdStr = getCellStringValue(row.getCell(0));
                String kpiName = getCellStringValue(row.getCell(4));
                String category = getCellStringValue(row.getCell(5));
                String target = getCellStringValue(row.getCell(6));
                String weightStr = getCellStringValue(row.getCell(8));

                final int rowIndex = i + 1;

                if (empIdStr.isEmpty() || kpiName.isEmpty() || category.isEmpty() || target.isEmpty() || weightStr.isEmpty()) {
                    throw new RuntimeException(
                            "Row " + rowIndex + " is invalid: Employee ID, KPI Name, Category, Target, and Weight are required.");
                }

                Employee emp = employeeRepository.findById(Long.parseLong(empIdStr.trim()))
                        .orElseThrow(() -> new RuntimeException(
                                "Row " + rowIndex + ": Employee ID " + empIdStr + " not found."));

                KpiRecord record = new KpiRecord();
                record.setEmployee(emp);
                
                // Set period info
                String periodIdStr = getCellStringValue(row.getCell(2));
                if (!periodIdStr.isEmpty()) {
                    record.setPeriodId(Long.parseLong(periodIdStr.trim()));
                }
                record.setPeriodName(getCellStringValue(row.getCell(3)));
                
                record.setKpi(kpiName);
                record.setCategory(category);
                record.setTarget(target);
                record.setUnit(getCellStringValue(row.getCell(7)));

                try {
                    BigDecimal weight = new BigDecimal(weightStr);
                    record.setWeight(weight);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Row " + rowIndex + ": Weight must be a valid number.");
                }

                record.setLogicDirection(getCellStringValue(row.getCell(9)));
                record.setActual(getCellStringValue(row.getCell(10)));
                record.setRemarks(getCellStringValue(row.getCell(11)));

                kpiService.calculateKpiMetrics(record);
                importedRecords.add(record);
            }

            // Save records as drafts initially
            return kpiService.saveKpiBatch(importedRecords, false, actorName);

        } catch (IOException e) {
            throw new RuntimeException("Failed to read Excel file: " + e.getMessage());
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                // For numeric values, check if it's a whole number
                double numValue = cell.getNumericCellValue();
                if (numValue == (long) numValue) {
                    return String.valueOf((long) numValue);
                }
                return String.valueOf(numValue);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (IllegalStateException e) {
                    return cell.getStringCellValue();
                }
            default:
                return "";
        }
    }
}