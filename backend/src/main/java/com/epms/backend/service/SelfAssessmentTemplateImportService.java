package com.epms.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.dto.selfassessmentform.SelfAssessmentTemplateImportValidationResponseDto;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SelfAssessmentTemplateImportService {

    private static final String DATA_SHEET_NAME = "Self Assessment Template";
    private static final String[] HEADERS = {"Question Text"};
    private static final int MAX_QUESTION_LENGTH = 100;

    private static final String[][] SAMPLE_ROWS = {
            {"How would you rate your performance in the current review period?"},
            {"What are your key achievements during this period?"},
            {"Identify areas where you need improvement."},
            {"How effectively do you collaborate with your team?"},
    };

    public byte[] generateTemplate() {
        try (Workbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle sampleStyle = wb.createCellStyle();
            sampleStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            sampleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Sheet instrSheet = wb.createSheet("Instructions");
            addInstructions(wb, instrSheet);

            Sheet sampleSheet = wb.createSheet("Sample Data");
            buildHeaderRow(sampleSheet, headerStyle);
            sampleSheet.createFreezePane(0, 1);
            writeSampleRows(sampleSheet, sampleStyle);
            addSampleSheetNote(wb, sampleSheet);

            Sheet dataSheet = wb.createSheet(DATA_SHEET_NAME);
            buildHeaderRow(dataSheet, headerStyle);
            dataSheet.createFreezePane(0, 1);
            dataSheet.setColumnWidth(0, 25000);

            wb.setActiveSheet(wb.getSheetIndex(dataSheet));

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);
            return bos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate self-assessment template", e);
        }
    }

    public SelfAssessmentTemplateImportValidationResponseDto validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a file to upload");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".xlsx")) {
            throw new IllegalArgumentException("Only .xlsx files are accepted. Please upload an Excel file with .xlsx extension.");
        }

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheet(DATA_SHEET_NAME);
            if (sheet == null) {
                throw new IllegalArgumentException("Excel file must contain a sheet named '" + DATA_SHEET_NAME + "'");
            }
            if (sheet.getPhysicalNumberOfRows() < 2) {
                throw new IllegalArgumentException("The Excel file is empty or has no data rows. Please download the template and fill it in.");
            }

            List<SelfAssessmentTemplateImportValidationResponseDto.ValidRow> validRows = new ArrayList<>();
            List<SelfAssessmentTemplateImportValidationResponseDto.InvalidRow> invalidRows = new ArrayList<>();
            Set<String> seenQuestions = new HashSet<>();

            int lastRowNum = sheet.getLastRowNum();
            for (int i = 1; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                int rowNum = i + 1;
                List<String> errors = new ArrayList<>();

                String questionText = getCellStringValue(row, 0);

                if (questionText == null || questionText.isBlank()) {
                    errors.add("Question Text is required");
                } else {
                    String trimmed = questionText.trim();
                    if (trimmed.length() > MAX_QUESTION_LENGTH) {
                        errors.add("Question Text must not exceed " + MAX_QUESTION_LENGTH + " characters");
                    }
                    if (!errors.isEmpty()) {
                        // continue to add to invalid
                    } else if (seenQuestions.contains(trimmed.toLowerCase())) {
                        errors.add("Duplicate question text");
                    } else {
                        seenQuestions.add(trimmed.toLowerCase());
                    }
                }

                if (!errors.isEmpty()) {
                    SelfAssessmentTemplateImportValidationResponseDto.InvalidRow invalidRow =
                            new SelfAssessmentTemplateImportValidationResponseDto.InvalidRow();
                    invalidRow.setRowNumber(rowNum);
                    invalidRow.setQuestionText(questionText != null ? questionText.trim() : null);
                    invalidRow.setErrors(errors);
                    invalidRows.add(invalidRow);
                } else {
                    SelfAssessmentTemplateImportValidationResponseDto.ValidRow validRow =
                            new SelfAssessmentTemplateImportValidationResponseDto.ValidRow();
                    validRow.setRowNumber(rowNum);
                    validRow.setQuestionText(questionText.trim());
                    validRows.add(validRow);
                }
            }

            if (validRows.isEmpty()) {
                throw new IllegalArgumentException("No valid data rows found in the file. Please check the template format.");
            }

            SelfAssessmentTemplateImportValidationResponseDto result =
                    new SelfAssessmentTemplateImportValidationResponseDto();
            result.setTotalRows(validRows.size() + invalidRows.size());
            result.setValidRows(validRows.size());
            result.setInvalidRows(invalidRows.size());
            result.setValidRowData(validRows);
            result.setInvalidRowsData(invalidRows);

            return result;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage(), e);
        }
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle headerStyle = wb.createCellStyle();
        Font headerFont = wb.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return headerStyle;
    }

    private void buildHeaderRow(Sheet sheet, CellStyle headerStyle) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 25000);
        }
    }

    private void writeSampleRows(Sheet sheet, CellStyle sampleStyle) {
        for (int r = 0; r < SAMPLE_ROWS.length; r++) {
            Row dataRow = sheet.createRow(r + 1);
            for (int c = 0; c < SAMPLE_ROWS[r].length; c++) {
                Cell cell = dataRow.createCell(c);
                cell.setCellValue(SAMPLE_ROWS[r][c]);
                cell.setCellStyle(sampleStyle);
            }
        }
    }

    private void addSampleSheetNote(Workbook wb, Sheet sampleSheet) {
        Row noteRow = sampleSheet.createRow(SAMPLE_ROWS.length + 2);
        Cell noteCell = noteRow.createCell(0);
        noteCell.setCellValue(
                "\u26a0 This sheet is for reference only. Enter your data in the '" + DATA_SHEET_NAME + "' sheet.");
        Font noteFont = wb.createFont();
        noteFont.setItalic(true);
        noteFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        CellStyle noteStyle = wb.createCellStyle();
        noteStyle.setFont(noteFont);
        noteCell.setCellStyle(noteStyle);
        sampleSheet.setColumnWidth(0, 20000);
    }

    private void addInstructions(Workbook wb, Sheet sheet) {
        Font titleFont = wb.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        CellStyle titleCs = wb.createCellStyle();
        titleCs.setFont(titleFont);

        Font boldFont = wb.createFont();
        boldFont.setBold(true);
        CellStyle boldCs = wb.createCellStyle();
        boldCs.setFont(boldFont);

        Font normalFont = wb.createFont();
        CellStyle normalCs = wb.createCellStyle();
        normalCs.setFont(normalFont);

        String[][] lines = {
                {"SELF-ASSESSMENT TEMPLATE BULK IMPORT \u2014 HOW TO USE THIS TEMPLATE", "title"},
                {"", "normal"},
                {"STEP 1 \u2014 READ THESE INSTRUCTIONS CAREFULLY", "bold"},
                {"  Fill in the 'Self Assessment Template' sheet only. Do NOT enter data in Sample Data or Instructions.", "normal"},
                {"  Save the file as .xlsx before uploading.", "normal"},
                {"", "normal"},
                {"STEP 2 \u2014 COLUMN GUIDE", "bold"},
                {"  Col A  Question Text    Required. Enter the question text for the self-assessment.", "normal"},
                {"", "normal"},
                {"STEP 3 \u2014 VALIDATION RULES", "bold"},
                {"  \u2022 Question Text is required (cannot be blank).", "normal"},
                {"  \u2022 Question Text must not exceed 100 characters.", "normal"},
                {"  \u2022 Duplicate questions (case-insensitive) are not allowed.", "normal"},
                {"  \u2022 Partial imports are allowed: valid rows can continue while invalid rows are reported.", "normal"},
                {"", "normal"},
                {"STEP 4 \u2014 IMPORT FLOW", "bold"},
                {"  1. Upload the file using the 'Import Template' button on Self Assessment Templates page.", "normal"},
                {"  2. The system validates all rows before saving any data.", "normal"},
                {"  3. Review valid and invalid rows in the import summary.", "normal"},
                {"  4. Set template name, target audience, timeline, and rating settings, then create templates.", "normal"},
                {"  5. Fix any failed rows in your file and re-upload if needed.", "normal"},
                {"", "normal"},
                {"NOTES", "bold"},
                {"  \u2022 The Excel file contains questions only. All template metadata is entered in the application.", "normal"},
                {"  \u2022 Template name, target audience, timeline, and rating are configured during import.", "normal"},
        };

        sheet.setColumnWidth(0, 25000);

        for (int i = 0; i < lines.length; i++) {
            Row row = sheet.createRow(i);
            Cell cell = row.createCell(0);
            cell.setCellValue(lines[i][0]);
            switch (lines[i][1]) {
                case "title" -> cell.setCellStyle(titleCs);
                case "bold" -> cell.setCellStyle(boldCs);
                default -> cell.setCellStyle(normalCs);
            }
        }
    }

    private boolean isRowEmpty(Row row) {
        Cell cell = row.getCell(0);
        return cell == null || cell.toString() == null || cell.toString().isBlank();
    }

    private String getCellStringValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return null;
        }
    }
}
