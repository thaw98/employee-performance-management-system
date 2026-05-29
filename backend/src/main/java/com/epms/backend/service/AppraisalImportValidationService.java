package com.epms.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.dto.hr.AppraisalImportRowErrorDto;
import com.epms.backend.dto.hr.AppraisalImportValidationResponseDto;
import com.epms.backend.entity.AppraisalImportSession;
import com.epms.backend.entity.AppraisalImportSessionItem;
import com.epms.backend.repository.AppraisalCategoryRepository;
import com.epms.backend.repository.AppraisalImportSessionItemRepository;
import com.epms.backend.repository.AppraisalImportSessionRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.util.ExcelCellReaderUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppraisalImportValidationService {

    private final AppraisalImportSessionRepository sessionRepository;
    private final AppraisalImportSessionItemRepository itemRepository;
    private final AppraisalCategoryRepository categoryRepository;

    private final ObjectMapper objectMapper = buildObjectMapper();

    private static ObjectMapper buildObjectMapper() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return om;
    }

    @Transactional
    public AppraisalImportValidationResponseDto validate(MultipartFile file, UserPrincipal principal) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".xlsx")) {
            throw new IllegalArgumentException("File must be .xlsx");
        }

        Workbook workbook = openWorkbook(file);
        Sheet sheet = workbook.getSheet("Appraisal Template");
        if (sheet == null) {
            closeWorkbook(workbook);
            throw new IllegalArgumentException("Excel file must contain a sheet named 'Appraisal Template'");
        }

        int lastRow = sheet.getLastRowNum();
        List<Map<String, Object>> validItems = new ArrayList<>();
        List<AppraisalImportRowErrorDto> invalidItems = new ArrayList<>();
        int totalProcessed = 0;

        // Track intra-file duplicate category+question pairs
        java.util.Set<String> seenPairs = new java.util.HashSet<>();

        // Track categories seen within the file for grouping
        java.util.Map<String, Integer> categorySortOrder = new java.util.LinkedHashMap<>();

        for (int rowIdx = 1; rowIdx <= lastRow; rowIdx++) {
            Row row = sheet.getRow(rowIdx);
            if (isRowFullyEmpty(row)) continue;

            totalProcessed++;
            Map<String, Object> rowData = parseRow(row);

            String categoryName = trimOrEmpty(rowData, "categoryName");
            String questionText = trimOrEmpty(rowData, "questionText");

            List<String> errors = new ArrayList<>();

            if (categoryName.isEmpty()) {
                errors.add("Category Name is required");
            }
            if (questionText.isEmpty()) {
                errors.add("Question Text is required");
            }

            // Check for duplicate category+question pair within the file
            if (!categoryName.isEmpty() && !questionText.isEmpty()) {
                String pairKey = (categoryName.toLowerCase() + "||" + questionText.toLowerCase());
                if (seenPairs.contains(pairKey)) {
                    errors.add("Duplicate category + question pair within the file");
                } else {
                    seenPairs.add(pairKey);
                }

                // Track sort order per category
                categorySortOrder.putIfAbsent(categoryName.toLowerCase(), categorySortOrder.size() + 1);
            }

            if (errors.isEmpty()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("rowNumber", rowIdx + 1);
                item.put("rowData", rowData);
                validItems.add(item);
            } else {
                AppraisalImportRowErrorDto errorItem = new AppraisalImportRowErrorDto();
                errorItem.setRowNumber(rowIdx + 1);
                errorItem.setRowData(rowData);
                errorItem.setErrors(errors);
                invalidItems.add(errorItem);
            }
        }

        closeWorkbook(workbook);

        String validationId = UUID.randomUUID().toString();
        AppraisalImportSession session = new AppraisalImportSession();
        session.setValidationId(validationId);
        session.setFileName(originalFilename);
        session.setCreatedByUserId(principal.getId());
        session.setCreatedAt(Instant.now());
        session.setCommitted(false);
        session.setTotalRows(totalProcessed);
        session.setValidRows(validItems.size());
        session.setInvalidRows(invalidItems.size());
        AppraisalImportSession savedSession = sessionRepository.save(session);

        // Persist valid items
        for (Map<String, Object> vi : validItems) {
            AppraisalImportSessionItem item = new AppraisalImportSessionItem();
            item.setSessionId(savedSession.getId());
            item.setRowNumber((Integer) vi.get("rowNumber"));
            item.setStatus("VALID");
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> rd = (Map<String, Object>) vi.get("rowData");
                item.setRowDataJson(objectMapper.writeValueAsString(rd));
            } catch (Exception e) {
                item.setRowDataJson("{}");
            }
            itemRepository.save(item);
        }

        // Persist invalid items
        for (AppraisalImportRowErrorDto inv : invalidItems) {
            AppraisalImportSessionItem item = new AppraisalImportSessionItem();
            item.setSessionId(savedSession.getId());
            item.setRowNumber(inv.getRowNumber());
            item.setStatus("INVALID");
            try {
                item.setRowDataJson(objectMapper.writeValueAsString(inv.getRowData()));
                item.setErrorMessagesJson(objectMapper.writeValueAsString(inv.getErrors()));
            } catch (Exception e) {
                item.setRowDataJson("{}");
                item.setErrorMessagesJson("[]");
            }
            itemRepository.save(item);
        }

        return new AppraisalImportValidationResponseDto(
                validationId, originalFilename, totalProcessed,
                validItems.size(), invalidItems.size(),
                validItems, invalidItems, false, null);
    }

    private Map<String, Object> parseRow(Row row) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("categoryName", ExcelCellReaderUtil.readString(row.getCell(0)));
        data.put("categoryDescription", ExcelCellReaderUtil.readString(row.getCell(1)));
        data.put("questionText", ExcelCellReaderUtil.readString(row.getCell(2)));
        return data;
    }

    private boolean isRowFullyEmpty(Row row) {
        if (row == null) return true;
        for (int c = 0; c < 3; c++) {
            if (!ExcelCellReaderUtil.isCellBlank(row.getCell(c))) return false;
        }
        return true;
    }

    private String trimOrEmpty(Map<String, Object> row, String key) {
        Object v = row.get(key);
        return v == null ? "" : v.toString().trim();
    }

    private Workbook openWorkbook(MultipartFile file) {
        String name = file.getOriginalFilename();
        try (InputStream is = file.getInputStream()) {
            if (name != null && name.toLowerCase().endsWith(".xls")) {
                return new HSSFWorkbook(is);
            }
            return new XSSFWorkbook(is);
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read Excel file: " + e.getMessage());
        }
    }

    private void closeWorkbook(Workbook wb) {
        try {
            wb.close();
        } catch (IOException ignored) {
        }
    }

    public Map<String, Object> parseRowDataJson(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}
