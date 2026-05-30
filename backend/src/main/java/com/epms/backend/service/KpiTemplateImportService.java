package com.epms.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.dto.KpiTemplateDto;
import com.epms.backend.dto.KpiTemplateImportCreateRequestDto;
import com.epms.backend.dto.KpiTemplateImportValidationResponseDto;
import com.epms.backend.entity.KpiCategory;
import com.epms.backend.entity.KpiName;
import com.epms.backend.entity.KpiTemplate;
import com.epms.backend.entity.KpiTemplateItem;
import com.epms.backend.entity.KpiUnit;
import com.epms.backend.repository.KpiCategoryRepository;
import com.epms.backend.repository.KpiNameRepository;
import com.epms.backend.repository.KpiTemplateRepository;
import com.epms.backend.repository.KpiUnitRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class KpiTemplateImportService {

    private final KpiTemplateRepository templateRepository;
    private final KpiNameRepository kpiNameRepository;
    private final KpiCategoryRepository kpiCategoryRepository;
    private final KpiUnitRepository kpiUnitRepository;

    private static final String DATA_SHEET_NAME = "KPI Template";
    private static final String[] HEADERS = {"KPI Name", "Category", "Target", "Unit", "Weight"};

    private static final String[][] SAMPLE_ROWS = {
            {"Revenue Growth", "Financial", "Increase revenue by 15%", "%", "25"},
            {"Customer Satisfaction", "Customer", "Achieve 90% satisfaction score", "%", "25"},
            {"Process Efficiency", "Operational", "Reduce processing time by 20%", "%", "25"},
            {"Employee Training", "HR", "Complete 4 training sessions per quarter", "count", "25"},
    };

    @Transactional(readOnly = true)
    public byte[] generateTemplate() {
        try (Workbook wb = new XSSFWorkbook()) {
            List<KpiCategory> categories = kpiCategoryRepository.findByStatusIgnoreCase("Active");
            List<KpiUnit> units = kpiUnitRepository.findByStatusIgnoreCase("Active");

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
            addInstructions(wb, instrSheet, categories, units);

            // ─── 2. Sample Data sheet (reference only) ────────────────────────────
            Sheet sampleSheet = wb.createSheet("Sample Data");
            buildHeaderRow(sampleSheet, headerStyle);
            sampleSheet.createFreezePane(0, 1);
            writeSampleRows(sampleSheet, sampleStyle);
            addSampleSheetNote(wb, sampleSheet);

            // ─── 3. KPI Template sheet (enter data here) ──────────────────────────
            Sheet dataSheet = wb.createSheet(DATA_SHEET_NAME);
            buildHeaderRow(dataSheet, headerStyle);
            dataSheet.createFreezePane(0, 1);
            for (int col = 0; col < HEADERS.length; col++) {
                dataSheet.setDefaultColumnStyle(col, unlockedStyle);
            }

            // ─── 4. Lookups sheet (hidden) ────────────────────────────────────────
            Sheet lookupSheet = wb.createSheet("Lookups");
            int r = 0;
            for (KpiCategory category : categories) {
                Row row = lookupSheet.createRow(r++);
                row.createCell(0).setCellValue(category.getName());
            }
            r = 0;
            for (KpiUnit unit : units) {
                Row row = lookupSheet.getRow(r);
                if (row == null) {
                    row = lookupSheet.createRow(r);
                }
                row.createCell(1).setCellValue(unit.getName());
                r++;
            }
            wb.setSheetHidden(wb.getSheetIndex("Lookups"), true);

            if (!categories.isEmpty()) {
                createNamedRange(wb, "CategoryList", "Lookups", 0, 0, categories.size() - 1, 0);
                addDropdown(dataSheet, "CategoryList", 1, 1000, 1, 1);
            }
            if (!units.isEmpty()) {
                createNamedRange(wb, "UnitList", "Lookups", 0, 1, units.size() - 1, 1);
                addDropdown(dataSheet, "UnitList", 1, 1000, 3, 3);
            }

            wb.setActiveSheet(wb.getSheetIndex(dataSheet));

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);
            return bos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate KPI template", e);
        }
    }

    @Transactional(readOnly = true)
    public KpiTemplateImportValidationResponseDto validate(MultipartFile file) {
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

            List<KpiTemplateImportValidationResponseDto.ValidRow> validRows = new ArrayList<>();
            List<KpiTemplateImportValidationResponseDto.InvalidRow> invalidRows = new ArrayList<>();

            int lastRowNum = sheet.getLastRowNum();
            for (int i = 1; i <= lastRowNum; i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) continue;

                int rowNum = i + 1;
                List<String> errors = new ArrayList<>();

                String name = getCellStringValue(row, 0);
                String category = getCellStringValue(row, 1);
                String target = getCellStringValue(row, 2);
                String unit = getCellStringValue(row, 3);
                BigDecimal weight = getCellBigDecimalValue(row, 4);

                if (name == null || name.isBlank()) {
                    errors.add("KPI Name is required");
                }
                if (category == null || category.isBlank()) {
                    errors.add("Category is required");
                }
                if (target == null || target.isBlank()) {
                    errors.add("Target is required");
                }
                if (weight == null) {
                    errors.add("Weight is required and must be a number");
                } else if (weight.compareTo(BigDecimal.ZERO) <= 0) {
                    errors.add("Weight must be greater than 0");
                }

                if (!errors.isEmpty()) {
                    KpiTemplateImportValidationResponseDto.InvalidRow invalidRow = new KpiTemplateImportValidationResponseDto.InvalidRow();
                    invalidRow.setRowNumber(rowNum);
                    invalidRow.setName(name);
                    invalidRow.setCategory(category);
                    invalidRow.setTarget(target);
                    invalidRow.setUnit(unit);
                    invalidRow.setWeight(weight);
                    invalidRow.setErrors(errors);
                    invalidRows.add(invalidRow);
                } else {
                    KpiTemplateImportValidationResponseDto.ValidRow validRow = new KpiTemplateImportValidationResponseDto.ValidRow();
                    validRow.setRowNumber(rowNum);
                    validRow.setName(name.trim());
                    validRow.setCategory(category.trim());
                    validRow.setTarget(target.trim());
                    validRow.setUnit(unit != null && !unit.isBlank() ? unit.trim() : null);
                    validRow.setWeight(weight);
                    validRows.add(validRow);
                }
            }

            BigDecimal totalWeight = validRows.stream()
                    .map(KpiTemplateImportValidationResponseDto.ValidRow::getWeight)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (validRows.isEmpty()) {
                throw new IllegalArgumentException("No valid data rows found in the file. Please check the template format.");
            }

            if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
                List<String> errors = List.of("Total weight must equal 100%. Current total: " + totalWeight.setScale(2, RoundingMode.HALF_UP) + "%");
                KpiTemplateImportValidationResponseDto.InvalidRow totalError = new KpiTemplateImportValidationResponseDto.InvalidRow();
                totalError.setRowNumber(0);
                totalError.setErrors(errors);
                invalidRows.add(totalError);
            }

            KpiTemplateImportValidationResponseDto result = new KpiTemplateImportValidationResponseDto();
            result.setTotalRows(validRows.size() + invalidRows.size());
            result.setValidRows(totalWeight.compareTo(new BigDecimal("100")) == 0 ? validRows.size() : 0);
            result.setInvalidRows(totalWeight.compareTo(new BigDecimal("100")) == 0 ? invalidRows.size() : validRows.size() + invalidRows.size());
            result.setValidRowData(validRows);
            result.setInvalidRowsData(invalidRows);

            return result;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage(), e);
        }
    }

    @Transactional
    public KpiTemplateDto createFromImport(KpiTemplateImportCreateRequestDto request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Template name is required");
        }
        if (request.getType() == null || request.getType().isBlank()) {
            throw new IllegalArgumentException("Template scope (type) is required");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("At least one KPI item is required");
        }

        String type = request.getType().toUpperCase();
        if (!List.of("INDIVIDUAL", "DEPARTMENT", "POSITION").contains(type)) {
            throw new IllegalArgumentException("Invalid template scope. Must be INDIVIDUAL, DEPARTMENT, or POSITION");
        }
        if ("DEPARTMENT".equals(type) && request.getDepartmentId() == null) {
            throw new IllegalArgumentException("Department is required for department-scoped templates");
        }
        if ("POSITION".equals(type)) {
            if (request.getDepartmentId() == null || request.getPositionId() == null) {
                throw new IllegalArgumentException("Department and Position are required for position-scoped templates");
            }
        }

        BigDecimal totalWeight = request.getItems().stream()
                .map(KpiTemplateImportCreateRequestDto.ImportItemDto::getWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalWeight.compareTo(new BigDecimal("100")) != 0) {
            throw new IllegalArgumentException("Total weight must equal 100%. Current total: " + totalWeight.setScale(2, RoundingMode.HALF_UP) + "%");
        }

        for (KpiTemplateImportCreateRequestDto.ImportItemDto item : request.getItems()) {
            if (item.getName() == null || item.getName().isBlank()) {
                throw new IllegalArgumentException("KPI Name is required for all rows");
            }
            if (item.getCategory() == null || item.getCategory().isBlank()) {
                throw new IllegalArgumentException("Category is required for all rows");
            }
            if (item.getTarget() == null || item.getTarget().isBlank()) {
                throw new IllegalArgumentException("Target is required for all rows");
            }
            if (item.getWeight() == null || item.getWeight().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Weight must be greater than 0 for all rows");
            }
        }

        ensureMasterDataExists(request.getItems());

        KpiTemplate template = new KpiTemplate();
        template.setName(request.getName().trim());
        template.setType(type);
        template.setDepartmentId(request.getDepartmentId());
        template.setPositionId(request.getPositionId());

        for (KpiTemplateImportCreateRequestDto.ImportItemDto item : request.getItems()) {
            KpiTemplateItem templateItem = new KpiTemplateItem();
            templateItem.setName(item.getName().trim());
            templateItem.setCategory(item.getCategory().trim());
            templateItem.setTarget(item.getTarget().trim());
            templateItem.setUnit(item.getUnit() != null && !item.getUnit().isBlank() ? item.getUnit().trim() : null);
            templateItem.setWeight(item.getWeight());
            template.addItem(templateItem);
        }

        KpiTemplate saved = templateRepository.save(template);

        KpiTemplateDto dto = new KpiTemplateDto();
        dto.setId(saved.getId());
        dto.setName(saved.getName());
        dto.setType(saved.getType());
        dto.setDepartmentId(saved.getDepartmentId());
        dto.setPositionId(saved.getPositionId());
        dto.setItems(saved.getItems().stream().map(item -> {
            KpiTemplateDto.KpiTemplateItemDto itemDto = new KpiTemplateDto.KpiTemplateItemDto();
            itemDto.setName(item.getName());
            itemDto.setCategory(item.getCategory());
            itemDto.setTarget(item.getTarget());
            itemDto.setUnit(item.getUnit());
            itemDto.setWeight(item.getWeight());
            return itemDto;
        }).collect(Collectors.toList()));
        return dto;
    }

    private void ensureMasterDataExists(List<KpiTemplateImportCreateRequestDto.ImportItemDto> items) {
        for (KpiTemplateImportCreateRequestDto.ImportItemDto item : items) {
            String kpiName = item.getName().trim();
            if (!kpiNameRepository.existsByNameIgnoreCase(kpiName)) {
                KpiName newName = new KpiName();
                newName.setName(kpiName);
                kpiNameRepository.save(newName);
            }

            String categoryName = item.getCategory().trim();
            if (!kpiCategoryRepository.existsByNameIgnoreCase(categoryName)) {
                KpiCategory newCategory = new KpiCategory();
                newCategory.setName(categoryName);
                kpiCategoryRepository.save(newCategory);
            }

            if (item.getUnit() != null && !item.getUnit().isBlank()) {
                String unitName = item.getUnit().trim();
                if (!kpiUnitRepository.existsByNameIgnoreCase(unitName)) {
                    KpiUnit newUnit = new KpiUnit();
                    newUnit.setName(unitName);
                    kpiUnitRepository.save(newUnit);
                }
            }
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
            int width = switch (i) {
                case 0 -> 6000;
                case 1 -> 5000;
                case 2 -> 8000;
                case 3 -> 5000;
                default -> 3000;
            };
            sheet.setColumnWidth(i, width);
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

    private void addInstructions(Workbook wb, Sheet sheet, List<KpiCategory> categories, List<KpiUnit> units) {
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
                {"KPI TEMPLATE BULK IMPORT — HOW TO USE THIS TEMPLATE", "title"},
                {"", "normal"},
                {"STEP 1 — READ THESE INSTRUCTIONS CAREFULLY", "bold"},
                {"  Fill in the 'KPI Template' sheet only. Do NOT enter data in Sample Data or Instructions.", "normal"},
                {"  Save the file as .xlsx before uploading.", "normal"},
                {"", "normal"},
                {"STEP 2 — COLUMN GUIDE", "bold"},
                {"  Col A  KPI Name    Required. Name of the KPI (e.g. Revenue Growth).", "normal"},
                {"  Col B  Category    Required. Select from dropdown or enter a new category name.", "normal"},
                {"  Col C  Target      Required. Measurable target description for this KPI.", "normal"},
                {"  Col D  Unit        Optional. Select from dropdown or enter a unit (e.g. %, count, rating).", "normal"},
                {"  Col E  Weight      Required. Numeric weight for this KPI. All rows must sum to exactly 100.", "normal"},
                {"", "normal"},
                {"STEP 3 — WEIGHT RULES", "bold"},
                {"  Every KPI row must have a weight greater than 0.", "normal"},
                {"  The total weight across all rows must equal 100%.", "normal"},
                {"  See the 'Sample Data' sheet for a complete example (4 KPIs at 25% each).", "normal"},
                {"", "normal"},
                {"STEP 4 — DROPDOWN COLUMNS", "bold"},
                {"  Use the dropdown arrows in columns B (Category) and D (Unit) when available.", "normal"},
                {"  You may also type a new category or unit name; it will be created on import.", "normal"},
                {"", "normal"},
                {"STEP 5 — VALIDATION & IMPORT FLOW", "bold"},
                {"  1. Upload the file using the 'Import Template' button on KPI Management.", "normal"},
                {"  2. The system validates all rows before saving any data.", "normal"},
                {"  3. Review valid and invalid rows in the import summary.", "normal"},
                {"  4. Set template name and scope, then confirm import to create the KPI template.", "normal"},
                {"  5. Fix any failed rows in your file and re-upload if needed.", "normal"},
                {"", "normal"},
                {"NOTES", "bold"},
                {"  • KPI Name, Category, Target, and Weight are required on every data row.", "normal"},
                {"  • New KPI names, categories, and units are automatically added to master data.", "normal"},
                {"  • After import, assign the template to employees, departments, or positions.", "normal"},
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

        int startRow = lines.length + 1;
        Row validHeader = sheet.createRow(startRow++);
        Font colHFont = wb.createFont();
        colHFont.setBold(true);
        colHFont.setColor(IndexedColors.DARK_BLUE.getIndex());
        CellStyle colHStyle = wb.createCellStyle();
        colHStyle.setFont(colHFont);
        Cell headerCell = validHeader.createCell(0);
        headerCell.setCellValue("VALID DROPDOWN VALUES (from database):");
        headerCell.setCellStyle(colHStyle);

        appendListSection(sheet, wb, startRow, "Category",
                categories.stream().map(KpiCategory::getName).toList());
        startRow += categories.size() + 2;
        appendListSection(sheet, wb, startRow, "Unit",
                units.stream().map(KpiUnit::getName).toList());
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
            Row row = sheet.createRow(startRow + 1 + i);
            row.createCell(0).setCellValue("    • " + values.get(i));
        }
    }

    private void createNamedRange(Workbook wb, String name, String sheetName,
            int startRow, int startCol, int endRow, int endCol) {
        if (endRow < startRow) {
            return;
        }
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

    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < 5; i++) {
            Cell cell = row.getCell(i);
            if (cell != null && cell.toString() != null && !cell.toString().isBlank()) {
                return false;
            }
        }
        return true;
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

    private BigDecimal getCellBigDecimalValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        try {
            switch (cell.getCellType()) {
                case NUMERIC:
                    return BigDecimal.valueOf(cell.getNumericCellValue());
                case STRING:
                    String str = cell.getStringCellValue().trim();
                    if (str.isEmpty()) return null;
                    return new BigDecimal(str);
                default:
                    return null;
            }
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
