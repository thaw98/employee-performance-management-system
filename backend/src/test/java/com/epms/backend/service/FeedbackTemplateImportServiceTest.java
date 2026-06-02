package com.epms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Optional;

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

import com.epms.backend.dto.feedbackmanagement.FeedbackTemplateImportValidationResponseDto;
import com.epms.backend.entity.Criteria;
import com.epms.backend.repository.CriteriaRepository;

@ExtendWith(MockitoExtension.class)
class FeedbackTemplateImportServiceTest {

    @Mock
    private CriteriaRepository criteriaRepository;

    private FeedbackTemplateImportService service;

    @BeforeEach
    void setUp() {
        service = new FeedbackTemplateImportService(criteriaRepository);
    }

    // ─── Template generation tests ─────────────────────────────────────────

    @Test
    void generateTemplate_shouldCreateCorrectSheetAndHeaders() throws Exception {
        byte[] template = service.generateTemplate();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(template))) {
            Sheet dataSheet = wb.getSheet("360 Feedback Template");
            assertThat(dataSheet).isNotNull();

            Row headerRow = dataSheet.getRow(0);
            assertThat(headerRow.getCell(0).getStringCellValue()).isEqualTo("Criteria Name");
            assertThat(headerRow.getCell(1).getStringCellValue()).isEqualTo("Description");
        }
    }

    @Test
    void generateTemplate_shouldHaveAllThreeSheets() throws Exception {
        byte[] template = service.generateTemplate();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(template))) {
            assertThat(wb.getSheet("Instructions")).isNotNull();
            assertThat(wb.getSheet("Sample Data")).isNotNull();
            assertThat(wb.getSheet("360 Feedback Template")).isNotNull();
        }
    }

    @Test
    void generateTemplate_shouldHaveBlankDataRows() throws Exception {
        byte[] template = service.generateTemplate();

        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(template))) {
            Sheet dataSheet = wb.getSheet("360 Feedback Template");
            assertThat(dataSheet.getPhysicalNumberOfRows()).isEqualTo(1);
        }
    }

    // ─── Import validation tests ───────────────────────────────────────────

    @Test
    void validate_shouldRejectNonXlsxFile() {
        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("file.xls");

        assertThatThrownBy(() -> service.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only .xlsx files");
    }

    @Test
    void validate_shouldRejectMissingSheet() throws Exception {
        byte[] xlsx = createExcelWithName("Wrong Sheet Name", "Test", "Desc");
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
            Sheet correctSheet = wb.getSheet("Wrong Sheet Name");
            wb.removeSheetAt(wb.getSheetIndex(correctSheet));

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getOriginalFilename()).thenReturn("test.xlsx");
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream(bos.toByteArray()));

            assertThatThrownBy(() -> service.validate(file))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("sheet named");
        }
    }

    @Test
    void validate_shouldRejectEmptyFile() throws Exception {
        byte[] xlsx = createExcelWithName("360 Feedback Template");

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        assertThatThrownBy(() -> service.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("empty");
    }

    @Test
    void validate_shouldRejectBlankCriteriaName() throws Exception {
        byte[] xlsx = createExcelMultiple(
                new String[]{"360 Feedback Template", "Criteria Name", "Description"},
                new String[]{"", "Some description"}
        );

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        assertThatThrownBy(() -> service.validate(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("No valid data rows");
    }

    @Test
    void validate_shouldReportInvalidRowsWhenMixedWithValid() throws Exception {
        when(criteriaRepository.findByNameIgnoreCase("Valid One")).thenReturn(Optional.empty());

        byte[] xlsx = createExcelMultiple(
                new String[]{"360 Feedback Template", "Criteria Name", "Description"},
                new String[]{"Valid One", "Good"},
                new String[]{"", "Bad"}
        );

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        FeedbackTemplateImportValidationResponseDto result = service.validate(file);
        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getInvalidRows()).isEqualTo(1);
        assertThat(result.getInvalidRowsData().get(0).getErrors()).contains("Criteria Name is required");
    }

    @Test
    void validate_shouldReportDuplicateRowsCaseInsensitively() throws Exception {
        when(criteriaRepository.findByNameIgnoreCase("Communication")).thenReturn(Optional.empty());

        byte[] xlsx = createExcelMultiple(
                new String[]{"360 Feedback Template", "Criteria Name", "Description"},
                new String[]{"Communication", "Team communication"},
                new String[]{"communication", "Duplicate"}
        );

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        FeedbackTemplateImportValidationResponseDto result = service.validate(file);
        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getInvalidRows()).isEqualTo(1);
        assertThat(result.getInvalidRowsData().get(0).getErrors()).contains("Duplicate criteria name");
    }

    @Test
    void validate_shouldReuseExistingCriteria() throws Exception {
        Criteria existing = new Criteria();
        existing.setId(42L);
        existing.setName("Communication");
        when(criteriaRepository.findByNameIgnoreCase("Communication")).thenReturn(Optional.of(existing));

        byte[] xlsx = createExcelMultiple(
                new String[]{"360 Feedback Template", "Criteria Name", "Description"},
                new String[]{"Communication", "Team communication skills"}
        );

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        FeedbackTemplateImportValidationResponseDto result = service.validate(file);
        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getValidRowData().get(0).getExistingCriteriaId()).isEqualTo(42L);
        assertThat(result.getValidRowData().get(0).getCriteriaName()).isEqualTo("Communication");
    }

    @Test
    void validate_shouldAllowPartialImportWithInvalidRows() throws Exception {
        when(criteriaRepository.findByNameIgnoreCase("Valid One")).thenReturn(Optional.empty());
        when(criteriaRepository.findByNameIgnoreCase("Another Valid")).thenReturn(Optional.empty());

        byte[] xlsx = createExcelMultiple(
                new String[]{"360 Feedback Template", "Criteria Name", "Description"},
                new String[]{"Valid One", "Good"},
                new String[]{"", "Missing name"},
                new String[]{"Another Valid", "Also good"}
        );

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        FeedbackTemplateImportValidationResponseDto result = service.validate(file);
        assertThat(result.getValidRows()).isEqualTo(2);
        assertThat(result.getInvalidRows()).isEqualTo(1);
        assertThat(result.getTotalRows()).isEqualTo(3);
    }

    @Test
    void validate_shouldAcceptValidImport() throws Exception {
        when(criteriaRepository.findByNameIgnoreCase("Communication")).thenReturn(Optional.empty());

        byte[] xlsx = createExcelMultiple(
                new String[]{"360 Feedback Template", "Criteria Name", "Description"},
                new String[]{"Communication", "Team communication skills"}
        );

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        FeedbackTemplateImportValidationResponseDto result = service.validate(file);
        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getValidRowData().get(0).getCriteriaName()).isEqualTo("Communication");
        assertThat(result.getValidRowData().get(0).getDescription()).isEqualTo("Team communication skills");
    }

    @Test
    void validate_shouldTrimWhitespace() throws Exception {
        when(criteriaRepository.findByNameIgnoreCase("Leadership")).thenReturn(Optional.empty());

        byte[] xlsx = createExcelMultiple(
                new String[]{"360 Feedback Template", "Criteria Name", "Description"},
                new String[]{"  Leadership  ", "  Inspires others  "}
        );

        MultipartFile file = mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getOriginalFilename()).thenReturn("test.xlsx");
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(xlsx));

        FeedbackTemplateImportValidationResponseDto result = service.validate(file);
        assertThat(result.getValidRows()).isEqualTo(1);
        assertThat(result.getValidRowData().get(0).getCriteriaName()).isEqualTo("Leadership");
        assertThat(result.getValidRowData().get(0).getDescription()).isEqualTo("Inspires others");
    }

    // ─── Helper methods ────────────────────────────────────────────────────

    private byte[] createExcelWithName(String sheetName, String... fields) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet(sheetName);
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Criteria Name");
            header.createCell(1).setCellValue("Description");

            if (fields.length >= 2) {
                Row row = sheet.createRow(1);
                row.createCell(0).setCellValue(fields[0]);
                row.createCell(1).setCellValue(fields[1]);
            }

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            wb.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private byte[] createExcelMultiple(String[] sheetInfo, String[]... rows) {
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet(sheetInfo[0]);
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue(sheetInfo[1]);
            header.createCell(1).setCellValue(sheetInfo[2]);

            for (int i = 0; i < rows.length; i++) {
                Row row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(rows[i][0]);
                if (rows[i].length > 1) {
                    row.createCell(1).setCellValue(rows[i][1]);
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
