package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.EmployeeImportSessionItemRepository;
import com.epms.backend.repository.EmployeeImportSessionRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.PositionRepository;
import com.epms.backend.repository.StaffTypeRepository;

@ExtendWith(MockitoExtension.class)
class EmployeeImportValidationServiceTest {

    @Mock
    private EmployeeImportSessionRepository sessionRepository;
    @Mock
    private EmployeeImportSessionItemRepository itemRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private PositionRepository positionRepository;
    @Mock
    private StaffTypeRepository staffTypeRepository;
    @Mock
    private EmployeeImportErrorFileService errorFileService;

    private EmployeeImportValidationService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeImportValidationService(
                sessionRepository,
                itemRepository,
                employeeRepository,
                departmentRepository,
                positionRepository,
                staffTypeRepository,
                errorFileService);

        when(employeeRepository.existsByEmployeeId(anyString())).thenReturn(false);
        when(employeeRepository.existsByStaffNrcNo(anyString())).thenReturn(false);
        when(employeeRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
    }

    @Test
    void validateRow_requiresMaritalStatus() throws Exception {
        Map<String, Object> row = validBaseRow();
        row.put("maritalStatus", "");

        List<String> errors = invokeValidateRow(row);

        assertTrue(errors.contains("marital_status is required"));
    }

    @Test
    void validateRow_requiresSpouseFieldsWhenMarried() throws Exception {
        Map<String, Object> row = validBaseRow();
        row.put("maritalStatus", "Married");
        row.put("spouseName", "");
        row.put("spouseNrc", "");

        List<String> errors = invokeValidateRow(row);

        assertTrue(errors.contains("spouse_name is required when marital_status is Married"));
        assertTrue(errors.contains("spouse_nrc is required when marital_status is Married"));
    }

    @Test
    void validateRow_doesNotRequireSpouseFieldsWhenSingle() throws Exception {
        Map<String, Object> row = validBaseRow();
        row.put("maritalStatus", "Single");
        row.put("spouseName", "");
        row.put("spouseNrc", "");

        List<String> errors = invokeValidateRow(row);

        assertFalse(errors.contains("spouse_name is required when marital_status is Married"));
        assertFalse(errors.contains("spouse_nrc is required when marital_status is Married"));
    }

    @SuppressWarnings("unchecked")
    private List<String> invokeValidateRow(Map<String, Object> row) throws Exception {
        Method method = EmployeeImportValidationService.class.getDeclaredMethod(
                "validateRow",
                Map.class,
                Set.class,
                Set.class,
                Set.class,
                Set.class,
                Set.class,
                Set.class,
                Set.class);
        method.setAccessible(true);

        Set<String> validDepartments = new HashSet<>(Set.of("it"));
        Set<String> validPositions = new HashSet<>(Set.of("developer"));
        Set<String> validStaffTypes = new HashSet<>(Set.of("permanent", "probation"));
        Set<String> validReligions = new HashSet<>(Set.of("buddhist"));

        return (List<String>) method.invoke(
                service,
                row,
                validDepartments,
                validPositions,
                validStaffTypes,
                validReligions,
                new HashSet<>(),
                new HashSet<>(),
                new HashSet<>());
    }

    private Map<String, Object> validBaseRow() {
        Map<String, Object> row = new HashMap<>();
        row.put("staffNo", "1001");
        row.put("fullName", "Test Employee");
        row.put("staffNrcNo", "12/TAMANA(N)123456");
        row.put("email", "test.employee@example.com");
        row.put("department", "IT");
        row.put("position", "Developer");
        row.put("phoneNumber", "09123456789");
        row.put("gender", "Male");
        row.put("dateOfBirth", "1990-01-01");
        row.put("hireDate", "2024-01-01");
        row.put("staffType", "Permanent");
        row.put("probationStartDate", "");
        row.put("probationEndDate", "");
        row.put("address", "Yangon");
        row.put("race", "Bamar");
        row.put("employmentStatus", "ACTIVE");
        row.put("religion", "Buddhist");
        row.put("emergencyContactRelationship", "Brother");
        row.put("emergencyContactPhone", "09987654321");
        row.put("fatherName", "U Father");
        row.put("fatherNrcNo", "12/TAMANA(N)654321");
        row.put("fatherOccupation", "Farmer");
        row.put("maritalStatus", "Single");
        row.put("spouseName", "");
        row.put("spouseNrc", "");
        row.put("profilePictureUrl", "");
        return row;
    }
}
