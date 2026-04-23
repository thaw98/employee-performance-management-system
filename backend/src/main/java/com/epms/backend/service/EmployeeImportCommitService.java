package com.epms.backend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.hr.EmployeeImportCommitRequestDto;
import com.epms.backend.dto.hr.EmployeeImportCommitResponseDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.EmergencyContact;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeFather;
import com.epms.backend.entity.EmployeeImportSession;
import com.epms.backend.entity.EmployeeImportSessionItem;
import com.epms.backend.entity.EmployeeProbation;
import com.epms.backend.entity.EmployeeReligion;
import com.epms.backend.entity.Gender;
import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.StaffType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeImportSessionItemRepository;
import com.epms.backend.repository.EmployeeImportSessionRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.StaffTypeRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.security.UserPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeImportCommitService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TEMP_PW_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    private static final int TEMP_PW_LENGTH = 12;

    private final EmployeeImportSessionRepository sessionRepository;
    private final EmployeeImportSessionItemRepository itemRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final StaffTypeRepository staffTypeRepository;
    private final PositionRoleResolutionService positionRoleResolutionService;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final AuditService auditService;

    private final ObjectMapper objectMapper = buildObjectMapper();

    private static ObjectMapper buildObjectMapper() {
        ObjectMapper om = new ObjectMapper();
        om.registerModule(new JavaTimeModule());
        om.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return om;
    }

    @Transactional
    public EmployeeImportCommitResponseDto commit(EmployeeImportCommitRequestDto request, UserPrincipal principal) {
        String validationId = request.getValidationId();
        if (validationId == null || validationId.isBlank()) {
            throw new IllegalArgumentException("validationId is required");
        }

        EmployeeImportSession session = sessionRepository.findByValidationId(validationId)
                .orElseThrow(() -> new IllegalArgumentException("Import session not found"));

        if (session.isCommitted()) {
            throw new IllegalStateException("This import session has already been committed");
        }

        List<EmployeeImportSessionItem> validItems = itemRepository
                .findBySessionIdAndStatusOrderByRowNumber(session.getId(), "VALID");

        int importedCount = 0;
        int failedCount = 0;

        // Preload master data maps for performance
        Map<String, Department> deptMap = new HashMap<>();
        departmentRepository.findAll().forEach(d -> deptMap.put(d.getName().trim().toLowerCase(), d));

        Map<String, Position> posMap = new HashMap<>();
        positionRepository.findAll().forEach(p -> posMap.put(p.getName().trim().toLowerCase(), p));

        Map<String, StaffType> stMap = new HashMap<>();
        staffTypeRepository.findAll().forEach(s -> stMap.put(s.getName().trim().toLowerCase(), s));

        for (EmployeeImportSessionItem item : validItems) {
            try {
                Map<String, Object> rowData = objectMapper.readValue(item.getRowDataJson(),
                        new TypeReference<Map<String, Object>>() {});

                importSingleRow(rowData, deptMap, posMap, stMap, principal);

                item.setStatus("IMPORTED");
                itemRepository.save(item);
                importedCount++;
            } catch (Exception e) {
                log.error("Failed to import row {}: {}", item.getRowNumber(), e.getMessage(), e);
                item.setStatus("FAILED");
                try {
                    item.setErrorMessagesJson("[\"" + e.getMessage().replace("\"", "'") + "\"]");
                } catch (Exception ignored) {}
                itemRepository.save(item);
                failedCount++;
            }
        }

        session.setCommitted(true);
        session.setCommittedAt(Instant.now());
        sessionRepository.save(session);

        // Audit log
        String desc = "HR user %d committed import session %s: %d imported, %d failed"
                .formatted(principal.getId(), validationId, importedCount, failedCount);
        String meta = "{\"validationId\":\"%s\",\"fileName\":\"%s\",\"importedCount\":%d,\"failedCount\":%d}"
                .formatted(validationId, session.getFileName(), importedCount, failedCount);
        auditService.record(
                AuditActionType.EMPLOYEE_BULK_IMPORT,
                AuditTargetType.EMPLOYEE,
                session.getId(),
                principal.getId(),
                principal.getRoleId(),
                desc,
                meta);

        String summaryMsg = importedCount + " imported, " + failedCount + " failed";
        return new EmployeeImportCommitResponseDto(true, summaryMsg, importedCount, failedCount, session.getId());
    }

    private void importSingleRow(Map<String, Object> row,
            Map<String, Department> deptMap,
            Map<String, Position> posMap,
            Map<String, StaffType> stMap,
            UserPrincipal principal) {

        String staffNo = strOrEmpty(row, "staffNo");
        String fullName = strOrEmpty(row, "fullName").trim();
        String staffNrcNo = strOrEmpty(row, "staffNrcNo").trim();
        String email = strOrEmpty(row, "email").trim().toLowerCase(Locale.ROOT);
        String deptName = strOrEmpty(row, "department").trim();
        String posName = strOrEmpty(row, "position").trim();
        String phoneNumber = strOrEmpty(row, "phoneNumber").trim();
        String genderStr = strOrEmpty(row, "gender").trim();
        String dobStr = strOrEmpty(row, "dateOfBirth");
        String hireDateStr = strOrEmpty(row, "hireDate");
        String staffTypeName = strOrEmpty(row, "staffType").trim();
        String probationStartStr = strOrEmpty(row, "probationStartDate");
        String probationEndStr = strOrEmpty(row, "probationEndDate");
        String address = strOrEmpty(row, "address").trim();
        String nationality = strOrEmpty(row, "nationality").trim();
        String religion = strOrEmpty(row, "religion").trim();
        String emergencyName = strOrEmpty(row, "emergencyContactName").trim();
        String emergencyRel = strOrEmpty(row, "emergencyContactRelationship").trim();
        String emergencyPhone = strOrEmpty(row, "emergencyContactPhone").trim();
        String fatherName = strOrEmpty(row, "fatherName").trim();
        String fatherNrcNo = strOrEmpty(row, "fatherNrcNo").trim();
        String fatherOccupation = strOrEmpty(row, "fatherOccupation").trim();

        // Resolve master data
        Department dept = deptMap.get(deptName.toLowerCase());
        if (dept == null) throw new IllegalArgumentException("Department not found: " + deptName);

        Position pos = posMap.get(posName.toLowerCase());
        if (pos == null) throw new IllegalArgumentException("Position not found: " + posName);

        StaffType staffType = stMap.get(staffTypeName.toLowerCase());
        if (staffType == null) throw new IllegalArgumentException("Staff type not found: " + staffTypeName);

        Gender gender = Gender.valueOf(genderStr);
        LocalDate dob = dobStr.isEmpty() ? null : LocalDate.parse(dobStr);
        LocalDate hireDate = hireDateStr.isEmpty() ? null : LocalDate.parse(hireDateStr);

        // Auto-generate staff_no if blank
        if (staffNo.isBlank()) {
            long max = employeeRepository.findMaxNumericStaffNo().orElse(0L);
            staffNo = String.valueOf(max + 1);
            // ensure uniqueness in case of concurrent imports
            while (employeeRepository.existsByEmployeeId(staffNo)) {
                staffNo = String.valueOf(Long.parseLong(staffNo) + 1);
            }
        }

        Employee employee = new Employee();
        employee.setEmployeeId(staffNo);
        employee.setEmployeeName(fullName);
        if (!staffNrcNo.isEmpty()) employee.setStaffNrcNo(staffNrcNo);
        employee.setEmail(email);
        employee.setGender(gender);
        employee.setDateOfBirth(dob);
        employee.setPhoneNo(phoneNumber);
        employee.setAddress(address);
        employee.setNationality(nationality);
        if (!religion.isEmpty()) employee.setReligion(EmployeeReligion.fromValue(religion));
        employee.setDepartment(dept);
        employee.setParentDepartment(dept);
        employee.setPosition(pos);
        employee.setStaffType(staffType);
        employee.setDateOfJoining(hireDate);
        employee.setCreatedBy(principal.getId());
        employee.setUpdatedBy(principal.getId());
        employee.setCreatedDate(Instant.now());
        employee.setUpdatedDate(Instant.now());

        // Father
        if (!fatherName.isEmpty()) {
            EmployeeFather father = new EmployeeFather();
            father.setFatherName(fatherName);
            if (!fatherNrcNo.isEmpty()) father.setFatherNrcNo(fatherNrcNo);
            if (!fatherOccupation.isEmpty()) father.setFatherOccupation(fatherOccupation);
            employee.setFather(father);
        }

        // Emergency contact
        EmergencyContact ec = new EmergencyContact();
        ec.setRelation(emergencyRel.isEmpty() ? emergencyName : emergencyRel);
        ec.setEmergencyPhone(emergencyPhone);
        employee.setEmergencyContact(ec);

        Employee savedEmployee = employeeRepository.save(employee);

        // Probation (only when staff_type is Probation)
        if (staffTypeName.equalsIgnoreCase("Probation")
                && (!probationStartStr.isEmpty() || !probationEndStr.isEmpty())) {
            EmployeeProbation probation = new EmployeeProbation();
            probation.setEmployee(savedEmployee);
            LocalDate probStart = null;
            LocalDate probEnd = null;
            if (!probationStartStr.isEmpty()) {
                probStart = LocalDate.parse(probationStartStr);
                probation.setProbationStartDate(probStart);
            }
            if (!probationEndStr.isEmpty()) {
                probEnd = LocalDate.parse(probationEndStr);
                probation.setProbationEndDate(probEnd);
            }
            // Auto-calculate probation days (inclusive) when both dates are present
            if (probStart != null && probEnd != null && !probEnd.isBefore(probStart)) {
                int days = (int) java.time.temporal.ChronoUnit.DAYS.between(probStart, probEnd);
                probation.setProbationDays(days);
            }
            savedEmployee.setProbation(probation);
            employeeRepository.save(savedEmployee);
        }

        // Create user account (role from position only)
        Role accountRole = positionRoleResolutionService.resolveRoleFromPositionId(pos.getId());
        String tempPassword = generateTemporaryPassword();
        User user = new User();
        user.setEmployee(savedEmployee);
        user.setRole(accountRole);
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setActive(true);
        user.setMustChangePassword(true);
        user.setCreatedDate(Instant.now());
        userRepository.save(user);

        // Send email (non-blocking on failure)
        try {
            mailService.sendTemporaryPasswordEmail(email, fullName, tempPassword);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", email, e.getMessage());
        }
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(TEMP_PW_LENGTH);
        for (int i = 0; i < TEMP_PW_LENGTH; i++) {
            sb.append(TEMP_PW_ALPHABET.charAt(RANDOM.nextInt(TEMP_PW_ALPHABET.length())));
        }
        return sb.toString();
    }

    private String strOrEmpty(Map<String, Object> map, String key) {
        Object v = map == null ? null : map.get(key);
        return v == null ? "" : v.toString();
    }
}
