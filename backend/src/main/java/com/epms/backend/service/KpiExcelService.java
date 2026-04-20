package com.epms.backend.service;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.KpiPeriod;
import com.epms.backend.entity.KpiRecord;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.KpiPeriodRepository;
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
    // MNA
    private final EmployeeRepository employeeRepository;
    private final KpiPeriodRepository kpiPeriodRepository;
    private final KpiService kpiService;

    // Ordered columns for standardized import/export
    private static final String[] COLUMNS = {
            "Employee ID", "Employee Name", "Period ID", "KPI Name", "Category",
            "Target", "Unit", "Weight (%)", "Logic Direction (higher/lower)", "Actual"
    };

    public KpiExcelService(EmployeeRepository employeeRepository, KpiPeriodRepository kpiPeriodRepository,
            KpiService kpiService) {
        this.employeeRepository = employeeRepository;
        this.kpiPeriodRepository = kpiPeriodRepository;
        this.kpiService = kpiService;
    }

    /**
     * KM-17: Generate an empty Excel template for bulk upload.
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
     * KM-18: Export existing KPIs with actuals to an Excel file.
     */
    public ByteArrayInputStream exportKpis(List<KpiRecord> records) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("KPI Export");

            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            // Add extra columns like Score and Status for export
            String[] exportCols = {
                    "Record ID", "Employee ID", "Employee Name", "Period Name", "KPI Name", "Category",
                    "Target", "Unit", "Weight (%)", "Logic Direction", "Actual", "Score", "Weighted Score", "Status"
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
                row.createCell(3).setCellValue(r.getPeriod().getName());
                row.createCell(4).setCellValue(r.getKpi() != null ? r.getKpi() : "");
                row.createCell(5).setCellValue(r.getCategory() != null ? r.getCategory() : "");
                row.createCell(6).setCellValue(r.getTarget() != null ? r.getTarget() : "");
                row.createCell(7).setCellValue(r.getUnit() != null ? r.getUnit() : "");
                row.createCell(8).setCellValue(r.getWeight() != null ? r.getWeight().doubleValue() : 0d);
                row.createCell(9).setCellValue(r.getLogicDirection() != null ? r.getLogicDirection() : "");
                row.createCell(10).setCellValue(r.getActual() != null ? r.getActual() : "");
                row.createCell(11).setCellValue(r.getScore() != null ? r.getScore() : 0);
                row.createCell(12).setCellValue(r.getWeightedScore() != null ? r.getWeightedScore().doubleValue() : 0d);
                row.createCell(13).setCellValue(r.getStatus() != null ? r.getStatus().name() : "");
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
     * KM-16: Import KPI data from an uploaded Excel file.
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
                String periodIdStr = getCellStringValue(row.getCell(2));
                String kpiName = getCellStringValue(row.getCell(3));

                final int rowIndex = i + 1;
                final String finalEmpId = empIdStr;
                final String finalPeriodId = periodIdStr;

                if (empIdStr.isEmpty() || periodIdStr.isEmpty() || kpiName.isEmpty()) {
                    throw new RuntimeException(
                            "Row " + rowIndex + " is invalid: Employee record ID, Period ID, and KPI Name are required.");
                }

                Employee emp = employeeRepository.findById(Long.parseLong(empIdStr.trim()))
                        .orElseThrow(() -> new RuntimeException(
                                "Row " + rowIndex + ": Employee record ID " + finalEmpId + " not found."));

                KpiPeriod period = kpiPeriodRepository.findById(Long.parseLong(periodIdStr))
                        .orElseThrow(() -> new RuntimeException(
                                "Row " + rowIndex + ": Period ID " + finalPeriodId + " not found."));

                KpiRecord record = new KpiRecord();
                record.setEmployee(emp);
                record.setPeriod(period);
                record.setKpi(kpiName);
                record.setCategory(getCellStringValue(row.getCell(4)));
                record.setTarget(getCellStringValue(row.getCell(5)));
                record.setUnit(getCellStringValue(row.getCell(6)));

                try {
                    String wStr = getCellStringValue(row.getCell(7));
                    record.setWeight(wStr.isEmpty() ? BigDecimal.ZERO : new BigDecimal(wStr));
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Row " + rowIndex + ": Weight must be a valid number.");
                }

                record.setLogicDirection(getCellStringValue(row.getCell(8)));
                record.setActual(getCellStringValue(row.getCell(9)));

                kpiService.calculateKpiMetrics(record);
                importedRecords.add(record);
            }

            // Save records as drafts initially (so weights don't accidentally block
            // import). HR can submit them via UI.
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
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }
}
