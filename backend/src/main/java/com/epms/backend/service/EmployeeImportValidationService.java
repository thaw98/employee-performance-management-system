package com.epms.backend.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.epms.backend.dto.hr.EmployeeImportRowErrorDto;
import com.epms.backend.dto.hr.EmployeeImportValidationResponseDto;
import com.epms.backend.entity.EmployeeImportSession;
import com.epms.backend.entity.EmployeeImportSessionItem;
import com.epms.backend.entity.EmployeeReligion;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeImportSessionItemRepository;
import com.epms.backend.repository.EmployeeImportSessionRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.StaffTypeRepository;
import com.epms.backend.security.UserPrincipal;
import com.epms.backend.util.ExcelCellReaderUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeImportValidationService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(?:\\+95[0-9]{5,12}|09[0-9]{6,13})$");

    private final EmployeeImportSessionRepository sessionRepository;
    private final EmployeeImportSessionItemRepository itemRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final StaffTypeRepository staffTypeRepository;
    private final EmployeeImportErrorFileService errorFileService;

    private final ObjectMapper objectMapper = buildObjectMapper();

    private static ObjectMapper buildObjectMapper() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return om;
    }

    @Transactional
    public EmployeeImportValidationResponseDto validate(MultipartFile file, UserPrincipal principal) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || (!originalFilename.toLowerCase().endsWith(".xlsx")
                && !originalFilename.toLowerCase().endsWith(".xls"))) {
            throw new IllegalArgumentException("File must be .xls or .xlsx");
        }

        Workbook workbook = openWorkbook(file);
        Sheet sheet = workbook.getSheet("Employees");
        if (sheet == null) {
            closeWorkbook(workbook);
            throw new IllegalArgumentException("Excel file must contain a sheet named 'Employees'");
        }

        // Collect valid department/position/staffType names for validation
        java.util.Set<String> validDepts = new java.util.HashSet<>(
                departmentRepository.findAll().stream().map(d -> d.getName().trim().toLowerCase()).toList());
        java.util.Set<String> validPositions = new java.util.HashSet<>(
                positionRepository.findAll().stream().map(p -> p.getName().trim().toLowerCase()).toList());
        java.util.Set<String> validStaffTypes = new java.util.HashSet<>(
                staffTypeRepository.findAll().stream().map(s -> s.getName().trim().toLowerCase()).toList());
        // Religion values from EmployeeReligion enum
        java.util.Set<String> validReligions = new java.util.HashSet<>(
                java.util.Arrays.stream(EmployeeReligion.values())
                        .map(r -> r.toApiLabel().toLowerCase()).toList());

        // Collect seen emails/staffNos/staffNrcNos within file to catch intra-file duplicates
        java.util.Set<String> seenEmails = new java.util.HashSet<>();
        java.util.Set<String> seenStaffNos = new java.util.HashSet<>();
        java.util.Set<String> seenStaffNrcNos = new java.util.HashSet<>();

        int lastRow = sheet.getLastRowNum();
        List<Map<String, Object>> validItems = new ArrayList<>();
        List<EmployeeImportRowErrorDto> invalidItems = new ArrayList<>();
        int totalProcessed = 0;

        for (int rowIdx = 1; rowIdx <= lastRow; rowIdx++) {
            Row row = sheet.getRow(rowIdx);
            if (isRowFullyEmpty(row)) continue;

            totalProcessed++;
            Map<String, Object> rowData = parseRow(row);
            List<String> errors = validateRow(rowData, validDepts, validPositions, validStaffTypes, validReligions, seenEmails, seenStaffNos, seenStaffNrcNos);

            String staffNo = trimOrEmpty(rowData, "staffNo");
            String email = trimOrEmpty(rowData, "email").toLowerCase();
            String staffNrcNo = trimOrEmpty(rowData, "staffNrcNo");

            if (!staffNo.isEmpty()) seenStaffNos.add(staffNo.toLowerCase());
            if (!email.isEmpty()) seenEmails.add(email);
            if (!staffNrcNo.isEmpty()) seenStaffNrcNos.add(staffNrcNo.toLowerCase());

            if (errors.isEmpty()) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("rowNumber", rowIdx + 1);
                item.put("rowData", rowData);
                validItems.add(item);
            } else {
                EmployeeImportRowErrorDto errorItem = new EmployeeImportRowErrorDto();
                errorItem.setRowNumber(rowIdx + 1);
                errorItem.setRowData(rowData);
                errorItem.setErrors(errors);
                invalidItems.add(errorItem);
            }
        }

        closeWorkbook(workbook);

        String validationId = UUID.randomUUID().toString();
        EmployeeImportSession session = new EmployeeImportSession();
        session.setValidationId(validationId);
        session.setFileName(originalFilename);
        session.setCreatedByUserId(principal.getId());
        session.setCreatedAt(Instant.now());
        session.setCommitted(false);
        session.setTotalRows(totalProcessed);
        session.setValidRows(validItems.size());
        session.setInvalidRows(invalidItems.size());
        EmployeeImportSession savedSession = sessionRepository.save(session);

        // Persist valid items
        for (Map<String, Object> vi : validItems) {
            EmployeeImportSessionItem item = new EmployeeImportSessionItem();
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
        for (EmployeeImportRowErrorDto inv : invalidItems) {
            EmployeeImportSessionItem item = new EmployeeImportSessionItem();
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

        // Generate error file if there are invalid rows
        String errorFileDownloadUrl = null;
        boolean errorFileAvailable = !invalidItems.isEmpty();
        if (errorFileAvailable) {
            try {
                byte[] errorFileBytes = errorFileService.generateErrorFile(invalidItems);
                String errorFilePath = errorFileService.saveErrorFile(validationId, errorFileBytes);
                savedSession.setErrorFilePath(errorFilePath);
                sessionRepository.save(savedSession);
                errorFileDownloadUrl = "/api/employees/import/error-file/" + validationId;
            } catch (Exception e) {
                // log but don't fail the validation
                errorFileAvailable = false;
            }
        }

        return new EmployeeImportValidationResponseDto(
                validationId, originalFilename, totalProcessed,
                validItems.size(), invalidItems.size(),
                validItems, invalidItems, errorFileAvailable, errorFileDownloadUrl);
    }

    private Map<String, Object> parseRow(Row row) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("staffNo",                    ExcelCellReaderUtil.readString(row.getCell(0)));
        data.put("fullName",                   ExcelCellReaderUtil.readString(row.getCell(1)));
        data.put("staffNrcNo",                 ExcelCellReaderUtil.readString(row.getCell(2)));
        data.put("email",                      ExcelCellReaderUtil.readString(row.getCell(3)));
        data.put("department",                 ExcelCellReaderUtil.readString(row.getCell(4)));
        data.put("position",                   ExcelCellReaderUtil.readString(row.getCell(5)));
        data.put("phoneNumber",                ExcelCellReaderUtil.readString(row.getCell(6)));
        data.put("gender",                     ExcelCellReaderUtil.readString(row.getCell(7)));
        LocalDate dob = ExcelCellReaderUtil.readDate(row.getCell(8));
        data.put("dateOfBirth",  dob != null ? dob.toString() : "");
        LocalDate hd = ExcelCellReaderUtil.readDate(row.getCell(9));
        data.put("hireDate",     hd  != null ? hd.toString()  : "");
        data.put("staffType",                  ExcelCellReaderUtil.readString(row.getCell(10)));
        LocalDate psd = ExcelCellReaderUtil.readDate(row.getCell(11));
        data.put("probationStartDate", psd != null ? psd.toString() : "");
        LocalDate ped = ExcelCellReaderUtil.readDate(row.getCell(12));
        data.put("probationEndDate",   ped != null ? ped.toString() : "");
        data.put("address",                    ExcelCellReaderUtil.readString(row.getCell(13)));
        data.put("nationality",                ExcelCellReaderUtil.readString(row.getCell(14)));
        data.put("employmentStatus",           ExcelCellReaderUtil.readString(row.getCell(15)));
        data.put("religion",                   ExcelCellReaderUtil.readString(row.getCell(16)));
        data.put("emergencyContactName",       ExcelCellReaderUtil.readString(row.getCell(17)));
        data.put("emergencyContactRelationship", ExcelCellReaderUtil.readString(row.getCell(18)));
        data.put("emergencyContactPhone",      ExcelCellReaderUtil.readString(row.getCell(19)));
        data.put("emergencyContactAddress",    ExcelCellReaderUtil.readString(row.getCell(20)));
        data.put("fatherName",                 ExcelCellReaderUtil.readString(row.getCell(21)));
        data.put("fatherNrcNo",                ExcelCellReaderUtil.readString(row.getCell(22)));
        data.put("fatherOccupation",           ExcelCellReaderUtil.readString(row.getCell(23)));
        return data;
    }

    private List<String> validateRow(Map<String, Object> row,
            java.util.Set<String> validDepts,
            java.util.Set<String> validPositions,
            java.util.Set<String> validStaffTypes,
            java.util.Set<String> validReligions,
            java.util.Set<String> seenEmails,
            java.util.Set<String> seenStaffNos,
            java.util.Set<String> seenStaffNrcNos) {
        List<String> errors = new ArrayList<>();

        String staffNo = trimOrEmpty(row, "staffNo");
        if (!staffNo.isEmpty()) {
            if (employeeRepository.existsByEmployeeId(staffNo)) {
                errors.add("staff_no '" + staffNo + "' already exists in database");
            }
            if (seenStaffNos.contains(staffNo.toLowerCase())) {
                errors.add("staff_no '" + staffNo + "' is duplicated within the file");
            }
        }

        String staffNrcNo = trimOrEmpty(row, "staffNrcNo");
        if (staffNrcNo.isEmpty()) {
            errors.add("staff_nrc_no is required");
        } else {
            if (employeeRepository.existsByStaffNrcNo(staffNrcNo)) {
                errors.add("staff_nrc_no '" + staffNrcNo + "' already exists in database");
            }
            if (seenStaffNrcNos.contains(staffNrcNo.toLowerCase())) {
                errors.add("staff_nrc_no '" + staffNrcNo + "' is duplicated within the file");
            }
        }

        String email = trimOrEmpty(row, "email").toLowerCase();
        if (email.isEmpty()) {
            errors.add("email is required");
        } else if (!EMAIL_PATTERN.matcher(email).matches()) {
            errors.add("email format is invalid");
        } else {
            if (employeeRepository.existsByEmailIgnoreCase(email)) {
                errors.add("email '" + email + "' already exists in database");
            }
            if (seenEmails.contains(email)) {
                errors.add("email '" + email + "' is duplicated within the file");
            }
        }

        requireField(errors, row, "fullName", "full_name is required");
        requireMaxLength(errors, row, "fullName", 50, "full_name must be at most 50 characters");

        String dept = trimOrEmpty(row, "department");
        if (dept.isEmpty()) {
            errors.add("department is required");
        } else if (!validDepts.contains(dept.toLowerCase())) {
            errors.add("department '" + dept + "' is not a valid department");
        }

        String pos = trimOrEmpty(row, "position");
        if (pos.isEmpty()) {
            errors.add("position is required");
        } else if (!validPositions.contains(pos.toLowerCase())) {
            errors.add("position '" + pos + "' is not a valid position");
        }

        String phone = trimOrEmpty(row, "phoneNumber");
        if (phone.isEmpty()) {
            errors.add("phone_number is required");
        } else if (!PHONE_PATTERN.matcher(phone).matches()) {
            errors.add("phone_number format is invalid (must start with +95 or 09)");
        }

        String gender = trimOrEmpty(row, "gender");
        if (gender.isEmpty()) {
            errors.add("gender is required");
        } else if (!gender.equals("Male") && !gender.equals("Female")) {
            errors.add("gender must be Male or Female");
        }

        String dob = trimOrEmpty(row, "dateOfBirth");
        if (dob.isEmpty()) {
            errors.add("date_of_birth is required");
        }

        String hireDate = trimOrEmpty(row, "hireDate");
        if (hireDate.isEmpty()) {
            errors.add("hire_date is required");
        }

        String staffType = trimOrEmpty(row, "staffType");
        if (staffType.isEmpty()) {
            errors.add("staff_type is required");
        } else if (!validStaffTypes.contains(staffType.toLowerCase())) {
            errors.add("staff_type '" + staffType + "' is not valid");
        }

        // Probation fields — required only when staff_type is Probation
        boolean isProbation = staffType.equalsIgnoreCase("Probation");
        if (isProbation) {
            if (trimOrEmpty(row, "probationStartDate").isEmpty()) {
                errors.add("probation_start_date is required when staff_type is Probation");
            }
            if (trimOrEmpty(row, "probationEndDate").isEmpty()) {
                errors.add("probation_end_date is required when staff_type is Probation");
            }
        }

        requireField(errors, row, "address", "address is required");
        requireField(errors, row, "nationality", "nationality is required");
        requireField(errors, row, "employmentStatus", "employment_status is required");

        String religion = trimOrEmpty(row, "religion");
        if (religion.isEmpty()) {
            errors.add("religion is required");
        } else if (!validReligions.contains(religion.toLowerCase())) {
            errors.add("religion '" + religion + "' is not a valid religion");
        }

        requireField(errors, row, "emergencyContactName", "emergency_contact_name is required");
        requireField(errors, row, "emergencyContactRelationship", "emergency_contact_relationship is required");

        String ecPhone = trimOrEmpty(row, "emergencyContactPhone");
        if (ecPhone.isEmpty()) {
            errors.add("emergency_contact_phone is required");
        } else if (!PHONE_PATTERN.matcher(ecPhone).matches()) {
            errors.add("emergency_contact_phone format is invalid (must start with +95 or 09)");
        }

        requireField(errors, row, "emergencyContactAddress", "emergency_contact_address is required");
        requireField(errors, row, "fatherName", "father_name is required");
        requireField(errors, row, "fatherNrcNo", "father_nrc_no is required");
        requireField(errors, row, "fatherOccupation", "father_occupation is required");

        return errors;
    }

    private boolean isRowFullyEmpty(Row row) {
        if (row == null) return true;
        for (int c = 0; c < 24; c++) {
            if (!ExcelCellReaderUtil.isCellBlank(row.getCell(c))) return false;
        }
        return true;
    }

    private String trimOrEmpty(Map<String, Object> row, String key) {
        Object v = row.get(key);
        return v == null ? "" : v.toString().trim();
    }

    private void requireField(List<String> errors, Map<String, Object> row, String key, String msg) {
        if (trimOrEmpty(row, key).isEmpty()) errors.add(msg);
    }

    private void requireMaxLength(List<String> errors, Map<String, Object> row, String key, int max, String msg) {
        String v = trimOrEmpty(row, key);
        if (v.length() > max) errors.add(msg);
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
