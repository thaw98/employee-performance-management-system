package com.epms.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppraisalImportTemplateService {

    private static final String DATA_SHEET_NAME = "Appraisal Template";
    private static final String[] HEADERS = { "Category Name", "Category Description", "Question Text" };

    private static final String[][] SAMPLE_ROWS = {
            { "Communication Skills", "Ability to communicate effectively",
                    "How well does the employee communicate with team members?" },
            { "Communication Skills", "Ability to communicate effectively",
                    "Does the employee present ideas clearly in meetings?" },
            { "Technical Competence", "Core technical skills for the role",
                    "Does the employee demonstrate strong technical knowledge?" },
            { "Technical Competence", "Core technical skills for the role",
                    "How well does the employee solve technical problems?" },
            { "Teamwork & Collaboration", "Working effectively with others",
                    "Does the employee contribute positively to team dynamics?" },
    };

    @Transactional(readOnly = true)
    public byte[] generateTemplate() {
        try (Workbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle unlockedStyle = wb.createCellStyle();
            unlockedStyle.setLocked(false);

            CellStyle sampleStyle = wb.createCellStyle();
            sampleStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            sampleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sampleStyle.setBorderBottom(BorderStyle.THIN);
            sampleStyle.setBorderTop(BorderStyle.THIN);
            sampleStyle.setBorderLeft(BorderStyle.THIN);
            sampleStyle.setBorderRight(BorderStyle.THIN);

            // ─── 1. Instructions sheet ────────────────────────────────────────────
            Sheet instrSheet = wb.createSheet("Instructions");
            addInstructions(wb, instrSheet);

            // ─── 2. Sample Data sheet (reference only) ────────────────────────────
            Sheet sampleSheet = wb.createSheet("Sample Data");
            buildHeaderRow(sampleSheet, headerStyle);
            sampleSheet.createFreezePane(0, 1);
            writeSampleRows(sampleSheet, sampleStyle);
            addSampleSheetNote(wb, sampleSheet);

            // ─── 3. Appraisal Template sheet (enter data here) ────────────────────
            Sheet dataSheet = wb.createSheet(DATA_SHEET_NAME);
            buildHeaderRow(dataSheet, headerStyle);
            dataSheet.createFreezePane(0, 1);
            for (int col = 0; col < HEADERS.length; col++) {
                dataSheet.setDefaultColumnStyle(col, unlockedStyle);
            }

            wb.setActiveSheet(wb.getSheetIndex(dataSheet));

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate appraisal import template", e);
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
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);
        return headerStyle;
    }

    private void buildHeaderRow(Sheet sheet, CellStyle headerStyle) {
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, i == 2 ? 8000 : i == 1 ? 5000 : 4000);
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
                "\u26a0 This sheet is for reference only. Enter your data in the 'Appraisal Template' sheet.");
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
                { "APPRAISAL BULK IMPORT — HOW TO USE THIS TEMPLATE", "title" },
                { "", "normal" },
                { "STEP 1 — READ THESE INSTRUCTIONS CAREFULLY", "bold" },
                { "  Fill in the 'Appraisal Template' sheet only. Do NOT enter data in Sample Data or Instructions.",
                        "normal" },
                { "  Save the file as .xlsx before uploading.", "normal" },
                { "", "normal" },
                { "STEP 2 — COLUMN GUIDE", "bold" },
                { "  Col A  Category Name         Required. Name of the appraisal category (e.g. Communication Skills).",
                        "normal" },
                { "  Col B  Category Description  Optional. Short description of the category.", "normal" },
                { "  Col C  Question Text         Required. One appraisal question per row.", "normal" },
                { "", "normal" },
                { "STEP 3 — HOW ROWS MAP TO CATEGORIES", "bold" },
                { "  Each row is one question. Use the same Category Name on multiple rows to add several questions",
                        "normal" },
                { "  under one category. Category Description can be repeated or left blank on follow-up rows.",
                        "normal" },
                { "  See the 'Sample Data' sheet for examples.", "normal" },
                { "", "normal" },
                { "STEP 4 — VALIDATION & IMPORT FLOW", "bold" },
                { "  1. Upload the file using the 'Import' button on the Appraisals page.", "normal" },
                { "  2. The system validates all rows before saving any data.", "normal" },
                { "  3. Review valid and invalid rows in the import summary.", "normal" },
                { "  4. Confirm import to create categories and questions.", "normal" },
                { "  5. Fix any failed rows in your file and re-upload if needed.", "normal" },
                { "", "normal" },
                { "NOTES", "bold" },
                { "  • Category Name and Question Text are required on every data row.", "normal" },
                { "  • Duplicate category + question pairs within the same file will fail validation.", "normal" },
                { "  • Rows that match an existing category name will add questions to that category.", "normal" },
                { "  • New category names will create new categories.", "normal" },
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
}
