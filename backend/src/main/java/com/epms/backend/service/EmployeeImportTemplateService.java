package com.epms.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Name;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.entity.Department;
import com.epms.backend.entity.EmployeeReligion;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.StaffType;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.StaffTypeRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeImportTemplateService {

    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final StaffTypeRepository staffTypeRepository;
    private static final DateTimeFormatter DD_MM_YYYY = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    /**
     * Column layout (0-indexed):
     *  0  staff_no
     *  1  full_name
     *  2  staff_nrc_no
     *  3  email
     *  4  department
     *  5  position
     *  6  phone_number              ← Text format
     *  7  gender
     *  8  date_of_birth             ← Text format
     *  9  hire_date                 ← Text format
     * 10  staff_type
     * 11  probation_start_date      (required if staff_type=Probation)  ← Text format
     * 12  probation_end_date        (required if staff_type=Probation)  ← Text format
     * 13  address
     * 14  race
     * 15  employment_status
     * 16  religion
     * 17  emergency_contact_relationship
     * 18  emergency_contact_phone   ← Text format
     * 19  father_name
     * 20  father_nrc_no
     * 21  father_occupation
     * 22  marital_status            (required: Single|Married)
     * 23  spouse_name               (required if marital_status=Married)
     * 24  spouse_nrc                (required if marital_status=Married)
     * 25  profile_picture_url       (optional)
     */
    private static final String[] HEADERS = {
            "staff_no", "title", "full_name", "staff_nrc_no", "email", "department", "position",
            "phone_number", "gender", "date_of_birth", "hire_date", "staff_type",
            "probation_start_date", "probation_end_date",
            "address", "race", "employment_status", "religion",
            "emergency_contact_relationship", "emergency_contact_phone",
            "father_name", "father_nrc_no", "father_occupation",
            "marital_status", "spouse_name", "spouse_nrc", "profile_picture_url"
    };

    private static final String[] GENDERS = { "Male", "Female" };
    private static final String[] MARITAL_STATUSES = { "Single", "Married" };
    private static final String[] EMPLOYMENT_STATUSES = { "ACTIVE" };
    private static final String[] RELIGIONS = java.util.Arrays.stream(EmployeeReligion.values())
            .map(EmployeeReligion::toApiLabel).toArray(String[]::new);

    /** Columns that must be Text format to preserve leading zeros. */
    private static final int TITLE_COL = 1;
    private static final int GENDER_COL = 8;
    private static final int[] TEXT_FORMAT_COLS = { 7, 19 };
    private static final int[] DATE_FORMAT_COLS = { 9, 10, 12, 13 };

    @Transactional(readOnly = true)
    public byte[] generateTemplate() {
        try (Workbook wb = new XSSFWorkbook()) {
            List<Department> departments = departmentRepository.findAll();
            List<Position> positions = positionRepository.findAll();
            List<StaffType> staffTypes = staffTypeRepository.findAll();

            // ─── Shared styles ────────────────────────────────────────────────────
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

            short textFmt = wb.createDataFormat().getFormat("@");
            CellStyle textStyle = wb.createCellStyle();
            textStyle.setDataFormat(textFmt);
            textStyle.setLocked(false);

            short dateFmt = wb.createDataFormat().getFormat("dd-mm-yyyy");
            CellStyle dateStyle = wb.createCellStyle();
            dateStyle.setDataFormat(dateFmt);
            dateStyle.setLocked(false);

            CellStyle unlockedStyle = wb.createCellStyle();
            unlockedStyle.setLocked(false);

            CellStyle titleCellStyle = wb.createCellStyle();
            titleCellStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            titleCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleCellStyle.setBorderBottom(BorderStyle.THIN);
            titleCellStyle.setBorderTop(BorderStyle.THIN);
            titleCellStyle.setBorderLeft(BorderStyle.THIN);
            titleCellStyle.setBorderRight(BorderStyle.THIN);
            titleCellStyle.setLocked(true);

            // ─── 1. Instructions sheet ────────────────────────────────────────────
            Sheet instrSheet = wb.createSheet("Instructions");
            addInstructions(wb, instrSheet, departments, positions, staffTypes, headerStyle);

            // ─── 2. Sample Data sheet (reference only) ────────────────────────────
            Sheet sampleSheet = wb.createSheet("Sample Data");
            buildHeaderRow(sampleSheet, headerStyle, textStyle);
            sampleSheet.createFreezePane(0, 1);

            // Row 1 — Probation example
            String deptSample = departments.isEmpty() ? "IT" : departments.get(0).getName();
            String posSample  = positions.isEmpty() ? "Developer" : positions.get(0).getName();
            String relSample  = RELIGIONS.length > 0 ? RELIGIONS[0] : "Buddhist";

            String[] sampleRow1 = {
                    "1",                              // staff_no
                    "U",                              // title
                    "Zaw Aung",                       // full_name
                    "12/TAMANA(N)123456",             // staff_nrc_no
                    "aungaung@example.com",           // email
                    deptSample,                       // department
                    posSample,                        // position
                    "09123456789",                    // phone_number
                    "Male",                           // gender
                    "15-06-1995",                     // date_of_birth
                    "01-01-2024",                     // hire_date
                    "Probation",                      // staff_type
                    "01-01-2024",                     // probation_start_date
                    "31-03-2024",                     // probation_end_date
                    "No.123, Main Street, Yangon",   // address
                    "Bamar",                          // race
                    "ACTIVE",                         // employment_status
                    relSample,                        // religion
                    "Sister",                         // emergency_contact_relationship
                    "09987654321",                    // emergency_contact_phone
                    "U Maung Maung",                  // father_name
                    "12/TAMANA(N)654321",             // father_nrc_no
                    "Farmer",                         // father_occupation
                    "Married",                        // marital_status
                    "Daw Mya Mya",                    // spouse_name
                    "12/TAMANA(N)111222",             // spouse_nrc
                    ""                                // profile_picture_url
            };

            // Row 2 — Permanent example (probation fields left blank)
            String[] sampleRow2 = {
                    "2",                              // staff_no
                    "Daw",                            // title
                    "Thu Zar",                        // full_name
                    "12/KAMAYA(N)789012",             // staff_nrc_no
                    "ayeaye@example.com",             // email
                    deptSample,                       // department
                    posSample,                        // position
                    "09111222333",                    // phone_number
                    "Female",                         // gender
                    "20-03-1990",                     // date_of_birth
                    "15-06-2023",                     // hire_date
                    "Permanent",                      // staff_type
                    "",                               // probation_start_date (blank)
                    "",                               // probation_end_date   (blank)
                    "No.789, 3rd Street, Mandalay",  // address
                    "Bamar",                          // race
                    "ACTIVE",                         // employment_status
                    relSample,                        // religion
                    "Brother",                        // emergency_contact_relationship
                    "09444555666",                    // emergency_contact_phone
                    "U Min Min",                      // father_name
                    "12/KAMAYA(N)345678",             // father_nrc_no
                    "Teacher",                        // father_occupation
                    "Single",                         // marital_status
                    "",                               // spouse_name
                    "",                               // spouse_nrc
                    ""                                // profile_picture_url
            };

            CellStyle sampleStyle = wb.createCellStyle();
            sampleStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            sampleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sampleStyle.setBorderBottom(BorderStyle.THIN);
            sampleStyle.setBorderTop(BorderStyle.THIN);
            sampleStyle.setBorderLeft(BorderStyle.THIN);
            sampleStyle.setBorderRight(BorderStyle.THIN);
            CellStyle dateSampleStyle = wb.createCellStyle();
            dateSampleStyle.cloneStyleFrom(sampleStyle);
            dateSampleStyle.setDataFormat(dateFmt);

            // Write row 1 (Probation)
            Row dataRow1 = sampleSheet.createRow(1);
            for (int i = 0; i < sampleRow1.length; i++) {
                Cell cell = dataRow1.createCell(i);
                setSampleCell(cell, sampleRow1[i], i, textStyle, dateSampleStyle, sampleStyle);
            }

            // Write row 2 (Permanent)
            Row dataRow2 = sampleSheet.createRow(2);
            for (int i = 0; i < sampleRow2.length; i++) {
                Cell cell = dataRow2.createCell(i);
                setSampleCell(cell, sampleRow2[i], i, textStyle, dateSampleStyle, sampleStyle);
            }

            // Apply formats to sample sheet
            for (int col : TEXT_FORMAT_COLS) {
                sampleSheet.setDefaultColumnStyle(col, textStyle);
            }
            for (int col : DATE_FORMAT_COLS) {
                sampleSheet.setDefaultColumnStyle(col, dateStyle);
            }
            sampleSheet.setColumnHidden(TITLE_COL, true);

            Row noteRow = sampleSheet.createRow(5);
            Cell noteCell = noteRow.createCell(0);
            noteCell.setCellValue("\u26a0 This sheet is for reference only. Enter your data in the 'Employees' sheet.");
            Font noteFont = wb.createFont();
            noteFont.setItalic(true);
            noteFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            CellStyle noteStyle = wb.createCellStyle();
            noteStyle.setFont(noteFont);
            noteCell.setCellStyle(noteStyle);
            sampleSheet.setColumnWidth(0, 20000);

            // ─── 3. Employees sheet ───────────────────────────────────────────────
            Sheet empSheet = wb.createSheet("Employees");
            buildHeaderRow(empSheet, headerStyle, textStyle);
            empSheet.createFreezePane(0, 1);

            // Apply text/date formats on employees sheet
            for (int col = 0; col < HEADERS.length; col++) {
                if (col != TITLE_COL) {
                    empSheet.setDefaultColumnStyle(col, unlockedStyle);
                }
            }
            for (int col : TEXT_FORMAT_COLS) {
                empSheet.setDefaultColumnStyle(col, textStyle);
            }
            for (int col : DATE_FORMAT_COLS) {
                empSheet.setDefaultColumnStyle(col, dateStyle);
            }
            applyTitleFormulas(empSheet, titleCellStyle, 1, 1000);
            empSheet.setColumnHidden(TITLE_COL, true);
            empSheet.protectSheet("title");

            // ─── 4. Lookups sheet (hidden) ────────────────────────────────────────
            Sheet lookupSheet = wb.createSheet("Lookups");

            // col 0 = departments
            int r = 0;
            for (Department d : departments) {
                Row row = lookupSheet.createRow(r++);
                row.createCell(0).setCellValue(d.getName());
            }
            // col 1 = positions
            r = 0;
            for (Position p : positions) {
                Row row = lookupSheet.getRow(r);
                if (row == null) row = lookupSheet.createRow(r);
                row.createCell(1).setCellValue(p.getName());
                r++;
            }
            // col 2 = staff types
            r = 0;
            for (StaffType st : staffTypes) {
                Row row = lookupSheet.getRow(r);
                if (row == null) row = lookupSheet.createRow(r);
                row.createCell(2).setCellValue(st.getName());
                r++;
            }
            // col 3 = genders
            for (int i = 0; i < GENDERS.length; i++) {
                Row row = lookupSheet.getRow(i);
                if (row == null) row = lookupSheet.createRow(i);
                row.createCell(3).setCellValue(GENDERS[i]);
            }
            // col 4 = employment statuses
            for (int i = 0; i < EMPLOYMENT_STATUSES.length; i++) {
                Row row = lookupSheet.getRow(i);
                if (row == null) row = lookupSheet.createRow(i);
                row.createCell(4).setCellValue(EMPLOYMENT_STATUSES[i]);
            }
            // col 5 = religions (from EmployeeReligion enum)
            for (int i = 0; i < RELIGIONS.length; i++) {
                Row row = lookupSheet.getRow(i);
                if (row == null) row = lookupSheet.createRow(i);
                row.createCell(5).setCellValue(RELIGIONS[i]);
            }
            // col 6 = marital statuses
            for (int i = 0; i < MARITAL_STATUSES.length; i++) {
                Row row = lookupSheet.getRow(i);
                if (row == null) row = lookupSheet.createRow(i);
                row.createCell(6).setCellValue(MARITAL_STATUSES[i]);
            }

            wb.setSheetHidden(wb.getSheetIndex("Lookups"), true);

            // ─── Named ranges ─────────────────────────────────────────────────────
            createNamedRange(wb, "DeptList",       "Lookups", 0, 0, departments.size() - 1, 0);
            createNamedRange(wb, "PosList",        "Lookups", 0, 1, positions.size() - 1,   1);
            createNamedRange(wb, "StaffTypeList",  "Lookups", 0, 2, staffTypes.size() - 1,  2);
            createNamedRange(wb, "GenderList",     "Lookups", 0, 3, GENDERS.length - 1,     3);
            createNamedRange(wb, "StatusList",     "Lookups", 0, 4, EMPLOYMENT_STATUSES.length - 1, 4);
            createNamedRange(wb, "ReligionList",   "Lookups", 0, 5, RELIGIONS.length - 1,   5);
            createNamedRange(wb, "MaritalStatusList", "Lookups", 0, 6, MARITAL_STATUSES.length - 1, 6);

            // ─── Dropdown validations on Employees sheet ──────────────────────────
            addDropdown(empSheet, "DeptList",      1, 1000, 5,  5);   // department
            addDropdown(empSheet, "PosList",       1, 1000, 6,  6);   // position
            addDropdown(empSheet, "GenderList",    1, 1000, 8,  8);   // gender
            addDropdown(empSheet, "StaffTypeList", 1, 1000, 11, 11);  // staff_type
            addDropdown(empSheet, "StatusList",    1, 1000, 16, 16);  // employment_status
            addDropdown(empSheet, "ReligionList",  1, 1000, 17, 17);  // religion
            addDropdown(empSheet, "MaritalStatusList", 1, 1000, 23, 23); // marital_status
            for (int col : DATE_FORMAT_COLS) {
                addDateValidation(empSheet, 1, 1000, col, col);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to generate import template", e);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private void buildHeaderRow(Sheet sheet, CellStyle headerStyle, CellStyle textStyle) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(HEADERS[i]);
            cell.setCellStyle(headerStyle);
            // wider for address/address-like columns
            int width = i == TITLE_COL ? 2200
                    : (i == 0 || i == 2 || i == 3 || i == 4) ? 4200
                    : i == 26 ? 9000
                    : (i == 15 || i == 21) ? 8000
                    : 5500;
            sheet.setColumnWidth(i, width);
        }
    }

    private void applyTitleFormulas(Sheet sheet, CellStyle titleCellStyle, int firstRow, int lastRow) {
        for (int rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                row = sheet.createRow(rowIndex);
            }
            Cell cell = row.getCell(TITLE_COL);
            if (cell == null) {
                cell = row.createCell(TITLE_COL);
            }
            int excelRow = rowIndex + 1;
            cell.setCellFormula(String.format("IF(%s%d=\"Male\",\"U\",IF(%s%d=\"Female\",\"Daw\",\"\"))",
                    col(GENDER_COL), excelRow, col(GENDER_COL), excelRow));
            cell.setCellStyle(titleCellStyle);
        }
    }

    private boolean isTextCol(int col) {
        for (int c : TEXT_FORMAT_COLS) {
            if (c == col) return true;
        }
        return false;
    }

    private boolean isDateCol(int col) {
        for (int c : DATE_FORMAT_COLS) {
            if (c == col) return true;
        }
        return false;
    }

    private void setSampleCell(Cell cell, String value, int col,
            CellStyle textStyle, CellStyle dateStyle, CellStyle defaultStyle) {
        if (isDateCol(col) && !value.isBlank()) {
            cell.setCellValue(java.sql.Date.valueOf(LocalDate.parse(value, DD_MM_YYYY)));
            cell.setCellStyle(dateStyle);
            return;
        }
        cell.setCellValue(value);
        cell.setCellStyle(isTextCol(col) ? textStyle : defaultStyle);
    }

    private void addInstructions(Workbook wb, Sheet sheet,
            List<Department> departments, List<Position> positions,
            List<StaffType> staffTypes,
            CellStyle titleStyle) {

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
            { "EMPLOYEE BULK IMPORT — HOW TO USE THIS TEMPLATE", "title" },
            { "", "normal" },
            { "STEP 1 — READ THESE INSTRUCTIONS CAREFULLY", "bold" },
            { "  Fill in the 'Employees' sheet only. Do NOT enter data in Sample Data or Instructions.", "normal" },
            { "  Save the file as .xlsx or .xls before uploading.", "normal" },
            { "", "normal" },
            { "STEP 2 — COLUMN GUIDE", "bold" },
            { "  Col A  staff_no               Optional. Leave blank to auto-generate.", "normal" },
            { "  title                      Hidden column. Auto-fills U for Male and Daw for Female based on gender.", "normal" },
            { "  Col C  full_name              Required. Enter the name with or without U/Daw; max 50 characters after title is applied.", "normal" },
            { "  Col D  staff_nrc_no           Required. Employee NRC number (e.g. 12/TAMANA(N)123456). Must be unique.", "normal" },
            { "  Col E  email                  Required. Must be a valid and unique email address.", "normal" },
            { "  Col F  department             Required. Select from dropdown.", "normal" },
            { "  Col G  position               Required. Select from dropdown.", "normal" },
            { "  Col H  phone_number           Required. Format: 09XXXXXXXXX or +95XXXXXXXXX.", "normal" },
            { "  Col I  gender                 Required. Select from dropdown: Male | Female.", "normal" },
            { "  Col J  date_of_birth          Required. Use Excel Date Picker or enter a valid date. Display format: dd-mm-yyyy.", "normal" },
            { "  Col K  hire_date              Required. Use Excel Date Picker or enter a valid date. Display format: dd-mm-yyyy.", "normal" },
            { "  Col L  staff_type             Required. Select from dropdown.", "normal" },
            { "  Col M  probation_start_date   Required if staff_type=Probation. Use Excel Date Picker. Display format: dd-mm-yyyy.", "normal" },
            { "  Col N  probation_end_date     Required if staff_type=Probation. Use Excel Date Picker. Display format: dd-mm-yyyy.", "normal" },
            { "  Col O  address                Required. Current residential address.", "normal" },
            { "  Col P  race                   Required. e.g. Bamar.", "normal" },
            { "  Col Q  employment_status      Required. Select from dropdown (ACTIVE).", "normal" },
            { "  Col R  religion               Required. Select from dropdown.", "normal" },
            { "  Col S  emergency_contact_relationship  Required. e.g. Sister, Mother.", "normal" },
            { "  Col T  emergency_contact_phone  Required. Format: 09XXXXXXXXX or +95XXXXXXXXX.", "normal" },
            { "  Col U  father_name            Required.", "normal" },
            { "  Col V  father_nrc_no          Required. Father NRC number.", "normal" },
            { "  Col W  father_occupation      Required. Father occupation (e.g. Farmer, Teacher).", "normal" },
            { "  Col X  marital_status          Required. Single or Married.", "normal" },
            { "  Col Y  spouse_name             Required if marital_status=Married.", "normal" },
            { "  Col Z  spouse_nrc              Required if marital_status=Married.", "normal" },
            { "  Col AA profile_picture_url     Optional. Public or system profile picture URL.", "normal" },
            { "", "normal" },
            { "STEP 3 — PROBATION FIELDS", "bold" },
            { "  If staff_type is 'Probation', you MUST fill cols M, N (start/end dates).", "normal" },
            { "  If staff_type is 'Permanent', leave cols M, N blank (they will be ignored).", "normal" },
            { "", "normal" },
            { "STEP 4 — DROPDOWN COLUMNS", "bold" },
            { "  Use the dropdown arrows in columns F, G, I, L, Q, R, X to pick valid values.", "normal" },
            { "  Typing a value not in the list will cause that row to fail validation.", "normal" },
            { "", "normal" },
            { "STEP 5 — DATE FORMAT", "bold" },
            { "  Columns J, K, M, N are formatted as Excel Date cells.", "normal" },
            { "  Use Excel Date Picker for these columns, or type a valid date and let Excel store it as a date.", "normal" },
            { "  Dates will display as dd-mm-yyyy. Example: 15-06-1995 (15 June 1995).", "normal" },
            { "", "normal" },
            { "STEP 6 — PHONE NUMBER FORMAT", "bold" },
            { "  Columns H, T are pre-formatted as Text so leading zeros are preserved.", "normal" },
            { "  Valid formats:  09123456789  or  +9512345678", "normal" },
            { "", "normal" },
            { "STEP 7 — VALIDATION & IMPORT FLOW", "bold" },
            { "  1. Upload the file using the 'Import Employees' button.", "normal" },
            { "  2. The system validates all rows before saving any data.", "normal" },
            { "  3. Valid rows are committed. Invalid rows are skipped.", "normal" },
            { "  4. A summary shows how many rows passed and failed.", "normal" },
            { "  5. Download the error file to see which rows failed and why.", "normal" },
            { "  6. Fix the errors in the original file and re-upload if needed.", "normal" },
            { "", "normal" },
            { "NOTES", "bold" },
            { "  • Duplicate staff_no, staff_nrc_no, or email (within the file or already in the system) will fail.", "normal" },
            { "  • If marital_status is Married, spouse_name and spouse_nrc are mandatory.", "normal" },
            { "  • If marital_status is Single, spouse_name and spouse_nrc are optional and ignored.", "normal" },
            { "  • A temporary password is auto-generated and emailed to each imported employee.", "normal" },
            { "  • Employees must change their password on first login.", "normal" },
        };

        sheet.setColumnWidth(0, 25000);

        for (int i = 0; i < lines.length; i++) {
            Row row = sheet.createRow(i);
            Cell cell = row.createCell(0);
            cell.setCellValue(lines[i][0]);
            switch (lines[i][1]) {
                case "title"  -> cell.setCellStyle(titleCs);
                case "bold"   -> cell.setCellStyle(boldCs);
                default       -> cell.setCellStyle(normalCs);
            }
        }

        // Valid dropdown values as reference
        int startRow = lines.length + 1;
        Row validHeader = sheet.createRow(startRow++);
        Font colHFont = wb.createFont();
        colHFont.setBold(true);
        colHFont.setColor(IndexedColors.DARK_BLUE.getIndex());
        CellStyle colHStyle = wb.createCellStyle();
        colHStyle.setFont(colHFont);
        Cell h = validHeader.createCell(0);
        h.setCellValue("VALID DROPDOWN VALUES (from database):");
        h.setCellStyle(colHStyle);

        appendListSection(sheet, wb, startRow, "Department", departments.stream().map(Department::getName).toList());
        startRow += departments.size() + 2;
        appendListSection(sheet, wb, startRow, "Position", positions.stream().map(Position::getName).toList());
        startRow += positions.size() + 2;
        appendListSection(sheet, wb, startRow, "Staff Type", staffTypes.stream().map(StaffType::getName).toList());
        startRow += staffTypes.size() + 2;
        appendListSection(sheet, wb, startRow, "Gender", List.of(GENDERS));
        startRow += GENDERS.length + 2;
        appendListSection(sheet, wb, startRow, "Employment Status", List.of(EMPLOYMENT_STATUSES));
        startRow += EMPLOYMENT_STATUSES.length + 2;
        appendListSection(sheet, wb, startRow, "Religion", List.of(RELIGIONS));
        startRow += RELIGIONS.length + 2;
        appendListSection(sheet, wb, startRow, "Marital Status", List.of(MARITAL_STATUSES));
    }

    private void appendListSection(Sheet sheet, Workbook wb, int startRow, String sectionName, List<String> values) {
        Font boldFont = wb.createFont();
        boldFont.setBold(true);
        CellStyle boldCs = wb.createCellStyle();
        boldCs.setFont(boldFont);

        Row titleRow = sheet.createRow(startRow);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("  " + sectionName + ":");
        titleCell.setCellStyle(boldCs);

        for (int i = 0; i < values.size(); i++) {
            Row r = sheet.createRow(startRow + 1 + i);
            r.createCell(0).setCellValue("    • " + values.get(i));
        }
    }

    private void createNamedRange(Workbook wb, String name, String sheetName,
            int startRow, int startCol, int endRow, int endCol) {
        if (endRow < startRow) return;
        Name namedRange = wb.createName();
        namedRange.setNameName(name);
        namedRange.setRefersToFormula(String.format("'%s'!$%s$%d:$%s$%d",
                sheetName, col(startCol), startRow + 1, col(endCol), endRow + 1));
    }

    private void addDropdown(Sheet sheet, String namedRange,
            int firstRow, int lastRow, int firstCol, int lastCol) {
        DataValidationHelper dvh = sheet.getDataValidationHelper();
        DataValidationConstraint dvc = dvh.createFormulaListConstraint(namedRange);
        DataValidation dv = dvh.createValidation(dvc,
                new CellRangeAddressList(firstRow, lastRow, firstCol, lastCol));
        dv.setShowErrorBox(true);
        sheet.addValidationData(dv);
    }

    private void addDateValidation(Sheet sheet,
            int firstRow, int lastRow, int firstCol, int lastCol) {
        DataValidationHelper dvh = sheet.getDataValidationHelper();
        DataValidationConstraint dvc = dvh.createDateConstraint(
                DataValidationConstraint.OperatorType.BETWEEN,
                "01-01-1900",
                "31-12-9999",
                "dd-mm-yyyy");
        DataValidation dv = dvh.createValidation(dvc,
                new CellRangeAddressList(firstRow, lastRow, firstCol, lastCol));
        dv.setEmptyCellAllowed(true);
        dv.setShowErrorBox(true);
        dv.createErrorBox("Invalid date", "Use Excel Date Picker or enter a valid date.");
        sheet.addValidationData(dv);
    }

    private String col(int col) {
        StringBuilder sb = new StringBuilder();
        col++;
        while (col > 0) {
            int rem = (col - 1) % 26;
            sb.insert(0, (char) ('A' + rem));
            col = (col - 1) / 26;
        }
        return sb.toString();
    }
}
