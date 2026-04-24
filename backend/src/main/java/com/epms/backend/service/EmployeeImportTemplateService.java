package com.epms.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
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
     * 14  nationality
     * 15  employment_status
     * 16  religion
     * 17  emergency_contact_relationship
     * 18  emergency_contact_phone   ← Text format
     * 19  father_name
     * 20  father_nrc_no
     * 21  father_occupation
     * 22  profile_picture_url       (optional)
     */
    private static final String[] HEADERS = {
            "staff_no", "full_name", "staff_nrc_no", "email", "department", "position",
            "phone_number", "gender", "date_of_birth", "hire_date", "staff_type",
            "probation_start_date", "probation_end_date",
            "address", "nationality", "employment_status", "religion",
            "emergency_contact_relationship", "emergency_contact_phone",
            "father_name", "father_nrc_no", "father_occupation",
            "profile_picture_url"
    };

    private static final String[] GENDERS = { "Male", "Female" };
    private static final String[] EMPLOYMENT_STATUSES = { "ACTIVE" };
    private static final String[] RELIGIONS = java.util.Arrays.stream(EmployeeReligion.values())
            .map(EmployeeReligion::toApiLabel).toArray(String[]::new);

    /** Columns that must be Text format: phone numbers + date columns (to preserve dd-mm-yyyy strings) */
    private static final int[] TEXT_FORMAT_COLS = { 6, 8, 9, 11, 12, 18 };

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
                    "Aung Aung",                      // full_name
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
                    "Myanmar",                        // nationality
                    "ACTIVE",                         // employment_status
                    relSample,                        // religion
                    "Sister",                         // emergency_contact_relationship
                    "09987654321",                    // emergency_contact_phone
                    "U Maung Maung",                  // father_name
                    "12/TAMANA(N)654321",             // father_nrc_no
                    "Farmer",                         // father_occupation
                    ""                                // profile_picture_url
            };

            // Row 2 — Permanent example (probation fields left blank)
            String[] sampleRow2 = {
                    "2",                              // staff_no
                    "Aye Aye",                        // full_name
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
                    "Myanmar",                        // nationality
                    "ACTIVE",                         // employment_status
                    relSample,                        // religion
                    "Brother",                        // emergency_contact_relationship
                    "09444555666",                    // emergency_contact_phone
                    "U Min Min",                      // father_name
                    "12/KAMAYA(N)345678",             // father_nrc_no
                    "Teacher",                        // father_occupation
                    ""                                // profile_picture_url
            };

            CellStyle sampleStyle = wb.createCellStyle();
            sampleStyle.setFillForegroundColor(IndexedColors.LIGHT_CORNFLOWER_BLUE.getIndex());
            sampleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sampleStyle.setBorderBottom(BorderStyle.THIN);
            sampleStyle.setBorderTop(BorderStyle.THIN);
            sampleStyle.setBorderLeft(BorderStyle.THIN);
            sampleStyle.setBorderRight(BorderStyle.THIN);

            // Write row 1 (Probation)
            Row dataRow1 = sampleSheet.createRow(1);
            for (int i = 0; i < sampleRow1.length; i++) {
                Cell cell = dataRow1.createCell(i);
                cell.setCellValue(sampleRow1[i]);
                cell.setCellStyle(isTextCol(i) ? textStyle : sampleStyle);
            }

            // Write row 2 (Permanent)
            Row dataRow2 = sampleSheet.createRow(2);
            for (int i = 0; i < sampleRow2.length; i++) {
                Cell cell = dataRow2.createCell(i);
                cell.setCellValue(sampleRow2[i]);
                cell.setCellStyle(isTextCol(i) ? textStyle : sampleStyle);
            }

            // Apply text format to phone columns on sample sheet
            for (int col : TEXT_FORMAT_COLS) {
                sampleSheet.setDefaultColumnStyle(col, textStyle);
            }

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

            // Apply text format to phone columns on employees sheet
            for (int col : TEXT_FORMAT_COLS) {
                empSheet.setDefaultColumnStyle(col, textStyle);
            }

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

            wb.setSheetHidden(wb.getSheetIndex("Lookups"), true);

            // ─── Named ranges ─────────────────────────────────────────────────────
            createNamedRange(wb, "DeptList",       "Lookups", 0, 0, departments.size() - 1, 0);
            createNamedRange(wb, "PosList",        "Lookups", 0, 1, positions.size() - 1,   1);
            createNamedRange(wb, "StaffTypeList",  "Lookups", 0, 2, staffTypes.size() - 1,  2);
            createNamedRange(wb, "GenderList",     "Lookups", 0, 3, GENDERS.length - 1,     3);
            createNamedRange(wb, "StatusList",     "Lookups", 0, 4, EMPLOYMENT_STATUSES.length - 1, 4);
            createNamedRange(wb, "ReligionList",   "Lookups", 0, 5, RELIGIONS.length - 1,   5);

            // ─── Dropdown validations on Employees sheet ──────────────────────────
            addDropdown(empSheet, "DeptList",      1, 1000, 4,  4);   // department
            addDropdown(empSheet, "PosList",       1, 1000, 5,  5);   // position
            addDropdown(empSheet, "GenderList",    1, 1000, 7,  7);   // gender
            addDropdown(empSheet, "StaffTypeList", 1, 1000, 10, 10);  // staff_type
            addDropdown(empSheet, "StatusList",    1, 1000, 15, 15);  // employment_status
            addDropdown(empSheet, "ReligionList",  1, 1000, 16, 16);  // religion

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
            int width = (i == 0 || i == 1 || i == 2 || i == 3) ? 4200
                    : i == 22 ? 9000
                    : (i == 14 || i == 20) ? 8000
                    : 5500;
            sheet.setColumnWidth(i, width);
        }
    }

    private boolean isTextCol(int col) {
        for (int c : TEXT_FORMAT_COLS) {
            if (c == col) return true;
        }
        return false;
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
            { "  Col B  full_name              Required. Max 50 characters.", "normal" },
            { "  Col C  staff_nrc_no           Required. Employee NRC number (e.g. 12/TAMANA(N)123456). Must be unique.", "normal" },
            { "  Col D  email                  Required. Must be a valid and unique email address.", "normal" },
            { "  Col E  department             Required. Select from dropdown.", "normal" },
            { "  Col F  position               Required. Select from dropdown.", "normal" },
            { "  Col G  phone_number           Required. Format: 09XXXXXXXXX or +95XXXXXXXXX.", "normal" },
            { "  Col H  gender                 Required. Select from dropdown: Male | Female.", "normal" },
            { "  Col I  date_of_birth          Required. Format: dd-mm-yyyy  e.g. 25-12-1990. Pre-formatted as Text.", "normal" },
            { "  Col J  hire_date              Required. Format: dd-mm-yyyy  e.g. 01-01-2024. Pre-formatted as Text.", "normal" },
            { "  Col K  staff_type             Required. Select from dropdown.", "normal" },
            { "  Col L  probation_start_date   Required if staff_type=Probation. Format: dd-mm-yyyy. Pre-formatted as Text.", "normal" },
            { "  Col M  probation_end_date     Required if staff_type=Probation. Format: dd-mm-yyyy. Pre-formatted as Text.", "normal" },
            { "  Col N  address                Required. Current residential address.", "normal" },
            { "  Col O  nationality            Required. e.g. Myanmar.", "normal" },
            { "  Col P  employment_status      Required. Select from dropdown (ACTIVE).", "normal" },
            { "  Col Q  religion               Required. Select from dropdown.", "normal" },
            { "  Col R  emergency_contact_relationship  Required. e.g. Sister, Mother.", "normal" },
            { "  Col S  emergency_contact_phone  Required. Format: 09XXXXXXXXX or +95XXXXXXXXX.", "normal" },
            { "  Col T  father_name            Required.", "normal" },
            { "  Col U  father_nrc_no          Required. Father NRC number.", "normal" },
            { "  Col V  father_occupation      Required. Father occupation (e.g. Farmer, Teacher).", "normal" },
            { "  Col W  profile_picture_url     Optional. Public or system profile picture URL.", "normal" },
            { "", "normal" },
            { "STEP 3 — PROBATION FIELDS", "bold" },
            { "  If staff_type is 'Probation', you MUST fill cols L, M (start/end dates).", "normal" },
            { "  If staff_type is 'Permanent', leave cols L, M blank (they will be ignored).", "normal" },
            { "", "normal" },
            { "STEP 4 — DROPDOWN COLUMNS", "bold" },
            { "  Use the dropdown arrows in columns E, F, H, K, P, Q to pick valid values.", "normal" },
            { "  Typing a value not in the list will cause that row to fail validation.", "normal" },
            { "", "normal" },
            { "STEP 5 — DATE FORMAT", "bold" },
            { "  All dates must use the format:  dd-mm-yyyy", "normal" },
            { "  Example:  15-06-1995  (15 June 1995)", "normal" },
            { "  Columns I, J, L, M are pre-formatted as Text so Excel will NOT convert your dates.", "normal" },
            { "  Type the date directly as text (e.g. 15-06-1995). Do NOT use Excel date picker.", "normal" },
            { "", "normal" },
            { "STEP 6 — PHONE NUMBER FORMAT", "bold" },
            { "  Columns G, S are pre-formatted as Text so leading zeros are preserved.", "normal" },
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
