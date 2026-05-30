package com.epms.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    private static final String[] HEADERS = {"KPI Name", "Category", "Target", "Unit", "Weight"};

    @Transactional(readOnly = true)
    public byte[] generateTemplate() {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("KPI Template");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            CellStyle descStyle = wb.createCellStyle();
            Font descFont = wb.createFont();
            descFont.setItalic(true);
            descFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
            descStyle.setFont(descFont);

            Row descRow = sheet.createRow(1);
            descRow.createCell(0).setCellValue("Required");
            descRow.createCell(1).setCellValue("Required");
            descRow.createCell(2).setCellValue("Required");
            descRow.createCell(3).setCellValue("Optional (e.g., %, count, rating)");
            descRow.createCell(4).setCellValue("Required (must sum to 100)");
            for (int i = 0; i < HEADERS.length; i++) {
                descRow.getCell(i).setCellStyle(descStyle);
            }

            Row exampleRow = sheet.createRow(2);
            exampleRow.createCell(0).setCellValue("Revenue Growth");
            exampleRow.createCell(1).setCellValue("Financial");
            exampleRow.createCell(2).setCellValue("Increase revenue by 15%");
            exampleRow.createCell(3).setCellValue("%");
            exampleRow.createCell(4).setCellValue("25");
            sheet.setColumnWidth(0, 6000);
            sheet.setColumnWidth(1, 5000);
            sheet.setColumnWidth(2, 8000);
            sheet.setColumnWidth(3, 5000);
            sheet.setColumnWidth(4, 3000);

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
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null || sheet.getPhysicalNumberOfRows() < 2) {
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
