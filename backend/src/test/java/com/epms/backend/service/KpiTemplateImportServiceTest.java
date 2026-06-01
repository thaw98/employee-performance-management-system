package com.epms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;

import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.dto.KpiTemplateDto;
import com.epms.backend.dto.KpiTemplateImportCreateRequestDto;
import com.epms.backend.dto.KpiTemplateImportCreateRequestDto.ImportItemDto;
import com.epms.backend.dto.KpiTemplateImportValidationResponseDto;
import com.epms.backend.entity.KpiName;
import com.epms.backend.entity.KpiTemplate;
import com.epms.backend.entity.KpiTemplateItem;
import com.epms.backend.repository.KpiNameRepository;
import com.epms.backend.repository.KpiTemplateRepository;

@ExtendWith(MockitoExtension.class)
class KpiTemplateImportServiceTest {

    @Mock
    private KpiTemplateRepository templateRepository;
    @Mock
    private KpiNameRepository kpiNameRepository;

    private KpiTemplateImportService service;

    @BeforeEach
    void setUp() {
        service = new KpiTemplateImportService(templateRepository, kpiNameRepository);
    }

    // ─── Template generation tests ─────────────────────────────────────────

    @Test
    void generateTemplate_shouldNotHaveUnitOrCategoryDropdown() throws Exception {
        byte[] template = service.generateTemplate();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(template))) {
            Sheet dataSheet = wb.getSheet("KPI Template");
            assertThat(dataSheet).isNotNull();

            List<? extends DataValidation> validations = dataSheet.getDataValidations();
            assertThat(validations).as("No column should have dropdown validation").isEmpty();

            Sheet lookupSheet = wb.getSheet("Lookups");
            assertThat(lookupSheet).isNull();
        }
    }

    @Test
    void generateTemplate_unitColumnShouldBePlainText() throws Exception {
        byte[] template = service.generateTemplate();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(template))) {
            Sheet dataSheet = wb.getSheet("KPI Template");
            assertThat(dataSheet).isNotNull();
            assertThat(dataSheet.getRow(0).getCell(3).getStringCellValue()).isEqualTo("Unit");

            List<? extends DataValidation> validations = dataSheet.getDataValidations();
            assertThat(validations).as("Unit column should not have dropdown validation").isEmpty();
        }
    }

    @Test
    void generateTemplate_shouldHaveCategoryColumnHeader() throws Exception {
        byte[] template = service.generateTemplate();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(template))) {
            Sheet dataSheet = wb.getSheet("KPI Template");
            Row headerRow = dataSheet.getRow(0);
            assertThat(headerRow.getCell(1).getStringCellValue()).isEqualTo("Category");
        }
    }

    @Test
    void generateTemplate_shouldHaveBlankEditableCategoryCells() throws Exception {
        byte[] template = service.generateTemplate();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(template))) {
            Sheet dataSheet = wb.getSheet("KPI Template");
            assertThat(dataSheet.getRow(1)).isNull();
        }
    }

    // ─── Import validation tests ───────────────────────────────────────────

    @Test
    void validate_shouldAcceptManuallyTypedCategory() throws Exception {
        byte[] xlsx = createExcel("Test KPI", "Custom Category", "Reach 100", "count", 100);

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("kpi.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        KpiTemplateImportValidationResponseDto result = service.validate(file);

        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getValidRowData().get(0).getCategory()).isEqualTo("Custom Category");
    }

    @Test
    void validate_shouldAcceptMultipleCustomCategories() throws Exception {
        byte[] xlsx = createExcel(
                "KPI 1", "Financial", "Grow revenue", "%", 50,
                "KPI 2", "Custom Category", "Improve quality", "%", 50);

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("kpi.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        KpiTemplateImportValidationResponseDto result = service.validate(file);

        assertThat(result.getValidRows()).isEqualTo(2);
        assertThat(result.getValidRowData().get(0).getCategory()).isEqualTo("Financial");
        assertThat(result.getValidRowData().get(1).getCategory()).isEqualTo("Custom Category");
    }

    @Test
    void validate_shouldRejectBlankCategory() throws Exception {
        byte[] xlsx = createExcel(
                "Valid KPI", "Exists", "Target", "%", 100,
                "KPI Name", "", "Target", "%", 0);

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("kpi.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        KpiTemplateImportValidationResponseDto result = service.validate(file);

        assertThat(result.getInvalidRows()).isEqualTo(1);
        assertThat(result.getInvalidRowsData().get(0).getErrors()).contains("Category is required");
    }

    @Test
    void validate_shouldRejectBlankCategoryWithSpecificMessage() throws Exception {
        byte[] xlsx = createExcel(
                "Valid KPI", "Exists", "Target", "%", 100,
                "KPI Name", "", "Target", "%", 0);

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("kpi.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        KpiTemplateImportValidationResponseDto result = service.validate(file);

        List<String> errors = result.getInvalidRowsData().get(0).getErrors();
        assertThat(errors).anyMatch(e -> e.equals("Category is required"));
    }

    @Test
    void validate_shouldTrimCategoryWhitespace() throws Exception {
        byte[] xlsx = createExcel("Test KPI", "  My Category  ", "Reach 100", "%", 100);

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("kpi.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        KpiTemplateImportValidationResponseDto result = service.validate(file);

        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getValidRowData().get(0).getCategory()).isEqualTo("My Category");
    }

    @Test
    void validate_shouldRejectWhitespaceOnlyCategory() throws Exception {
        byte[] xlsx = createExcel(
                "Valid KPI", "Exists", "Target", "%", 100,
                "Test KPI", "   ", "Target", "%", 0);

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("kpi.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        KpiTemplateImportValidationResponseDto result = service.validate(file);

        assertThat(result.getInvalidRows()).isEqualTo(1);
        assertThat(result.getInvalidRowsData().get(0).getErrors()).contains("Category is required");
    }

    // ─── createFromImport tests ────────────────────────────────────────────

    @Test
    void createFromImport_shouldStoreFreetextCategory() {
        ImportItemDto item = new ImportItemDto();
        item.setName("Test KPI");
        item.setCategory("Custom Freetext Category");
        item.setTarget("Reach target");
        item.setUnit("%");
        item.setWeight(BigDecimal.valueOf(100));

        KpiTemplateImportCreateRequestDto request = new KpiTemplateImportCreateRequestDto();
        request.setName("Test Template");
        request.setType("INDIVIDUAL");
        request.setItems(List.of(item));

        KpiTemplate savedTemplate = new KpiTemplate();
        savedTemplate.setId(1L);
        savedTemplate.setName("Test Template");
        savedTemplate.setType("INDIVIDUAL");
        KpiTemplateItem savedItem = new KpiTemplateItem();
        savedItem.setName("Test KPI");
        savedItem.setCategory("Custom Freetext Category");
        savedItem.setTarget("Reach target");
        savedItem.setUnit("%");
        savedItem.setWeight(BigDecimal.valueOf(100));
        savedTemplate.addItem(savedItem);

        when(kpiNameRepository.existsByNameIgnoreCase("Test KPI")).thenReturn(false);
        when(kpiNameRepository.save(any(KpiName.class))).thenAnswer(i -> i.getArgument(0));
        when(templateRepository.save(any(KpiTemplate.class))).thenReturn(savedTemplate);

        KpiTemplateDto result = service.createFromImport(request);

        assertThat(result.getItems().get(0).getCategory()).isEqualTo("Custom Freetext Category");
    }

    @Test
    void createFromImport_shouldNotLookupCategoryInDb() {
        ImportItemDto item = new ImportItemDto();
        item.setName("Test KPI");
        item.setCategory("Category Not In DB");
        item.setTarget("Reach target");
        item.setUnit(null);
        item.setWeight(BigDecimal.valueOf(100));

        KpiTemplateImportCreateRequestDto request = new KpiTemplateImportCreateRequestDto();
        request.setName("Test Template");
        request.setType("INDIVIDUAL");
        request.setItems(List.of(item));

        KpiTemplate savedTemplate = new KpiTemplate();
        savedTemplate.setId(1L);
        savedTemplate.setName("Test Template");
        savedTemplate.setType("INDIVIDUAL");
        KpiTemplateItem savedItem = new KpiTemplateItem();
        savedItem.setName("Test KPI");
        savedItem.setCategory("Category Not In DB");
        savedItem.setTarget("Reach target");
        savedItem.setUnit(null);
        savedItem.setWeight(BigDecimal.valueOf(100));
        savedTemplate.addItem(savedItem);

        when(kpiNameRepository.existsByNameIgnoreCase("Test KPI")).thenReturn(false);
        when(kpiNameRepository.save(any(KpiName.class))).thenAnswer(i -> i.getArgument(0));
        when(templateRepository.save(any(KpiTemplate.class))).thenReturn(savedTemplate);

        KpiTemplateDto result = service.createFromImport(request);

        assertThat(result.getItems().get(0).getCategory()).isEqualTo("Category Not In DB");
        verify(templateRepository).save(any(KpiTemplate.class));
    }

    @Test
    void createFromImport_shouldRejectBlankCategory() {
        ImportItemDto item = new ImportItemDto();
        item.setName("Test KPI");
        item.setCategory("");
        item.setTarget("Reach target");
        item.setUnit("%");
        item.setWeight(BigDecimal.valueOf(100));

        KpiTemplateImportCreateRequestDto request = new KpiTemplateImportCreateRequestDto();
        request.setName("Test Template");
        request.setType("INDIVIDUAL");
        request.setItems(List.of(item));

        assertThatThrownBy(() -> service.createFromImport(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Category is required for all rows");
    }

    @Test
    void createFromImport_shouldRejectNullCategory() {
        ImportItemDto item = new ImportItemDto();
        item.setName("Test KPI");
        item.setCategory(null);
        item.setTarget("Reach target");
        item.setUnit("%");
        item.setWeight(BigDecimal.valueOf(100));

        KpiTemplateImportCreateRequestDto request = new KpiTemplateImportCreateRequestDto();
        request.setName("Test Template");
        request.setType("INDIVIDUAL");
        request.setItems(List.of(item));

        assertThatThrownBy(() -> service.createFromImport(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Category is required for all rows");
    }

    @Test
    void createFromImport_shouldTrimCategoryOnItem() {
        ImportItemDto item = new ImportItemDto();
        item.setName("Test KPI");
        item.setCategory("  Trimmed Category  ");
        item.setTarget("Reach target");
        item.setUnit("%");
        item.setWeight(BigDecimal.valueOf(100));

        KpiTemplateImportCreateRequestDto request = new KpiTemplateImportCreateRequestDto();
        request.setName("Test Template");
        request.setType("INDIVIDUAL");
        request.setItems(List.of(item));

        KpiTemplate savedTemplate = new KpiTemplate();
        savedTemplate.setId(1L);
        savedTemplate.setName("Test Template");
        savedTemplate.setType("INDIVIDUAL");
        KpiTemplateItem savedItem = new KpiTemplateItem();
        savedItem.setName("Test KPI");
        savedItem.setCategory("Trimmed Category");
        savedItem.setTarget("Reach target");
        savedItem.setUnit("%");
        savedItem.setWeight(BigDecimal.valueOf(100));
        savedTemplate.addItem(savedItem);

        when(kpiNameRepository.existsByNameIgnoreCase("Test KPI")).thenReturn(false);
        when(kpiNameRepository.save(any(KpiName.class))).thenAnswer(i -> i.getArgument(0));
        when(templateRepository.save(any(KpiTemplate.class))).thenReturn(savedTemplate);

        KpiTemplateDto result = service.createFromImport(request);
        assertThat(result.getItems().get(0).getCategory()).isEqualTo("Trimmed Category");
    }

    // ─── Regression tests ──────────────────────────────────────────────────

    @Test
    void validate_shouldStillAcceptValidFieldsNormally() throws Exception {
        byte[] xlsx = createExcel("Revenue Growth", "Financial", "Increase 15%", "%", 100);

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("kpi.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        KpiTemplateImportValidationResponseDto result = service.validate(file);

        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getValidRowData().get(0).getName()).isEqualTo("Revenue Growth");
        assertThat(result.getValidRowData().get(0).getCategory()).isEqualTo("Financial");
        assertThat(result.getValidRowData().get(0).getTarget()).isEqualTo("Increase 15%");
        assertThat(result.getValidRowData().get(0).getUnit()).isEqualTo("%");
        assertThat(result.getValidRowData().get(0).getWeight()).isEqualByComparingTo("100");
    }

    // ─── Helper methods ────────────────────────────────────────────────────

    private byte[] createExcel(Object... fields) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("KPI Template");
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("KPI Name");
            header.createCell(1).setCellValue("Category");
            header.createCell(2).setCellValue("Target");
            header.createCell(3).setCellValue("Unit");
            header.createCell(4).setCellValue("Weight");

            for (int i = 0; i < fields.length; i += 5) {
                int rowIdx = i / 5;
                Row row = sheet.createRow(rowIdx + 1);
                row.createCell(0).setCellValue((String) fields[i]);
                row.createCell(1).setCellValue((String) fields[i + 1]);
                row.createCell(2).setCellValue((String) fields[i + 2]);
                row.createCell(3).setCellValue((String) fields[i + 3]);
                Object weight = fields[i + 4];
                if (weight instanceof Integer) {
                    row.createCell(4).setCellValue((Integer) weight);
                } else {
                    row.createCell(4).setCellValue((Double) weight);
                }
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
