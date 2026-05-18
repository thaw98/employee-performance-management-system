package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
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

@ExtendWith(MockitoExtension.class)
class EmployeeImportCommitServiceTest {

    @Mock
    private EmployeeImportSessionRepository sessionRepository;
    @Mock
    private EmployeeImportSessionItemRepository itemRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private PositionRepository positionRepository;
    @Mock
    private StaffTypeRepository staffTypeRepository;
    @Mock
    private PositionRoleResolutionService positionRoleResolutionService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private MailService mailService;
    @Mock
    private AuditService auditService;

    private EmployeeImportCommitService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeImportCommitService(
                sessionRepository,
                itemRepository,
                employeeRepository,
                userRepository,
                departmentRepository,
                positionRepository,
                staffTypeRepository,
                positionRoleResolutionService,
                passwordEncoder,
                mailService,
                auditService);
    }

    @Test
    void importSingleRow_storesRawNameWithGenderTitle() throws Exception {
        ArgumentCaptor<Employee> employeeCaptor = prepareImportMocks();

        invokeImportSingleRow(rowWithName("Zaw Aung", "Male"));

        assertEquals("U Zaw Aung", employeeCaptor.getValue().getEmployeeName());
    }

    @Test
    void importSingleRow_doesNotDoublePrefixExistingTitle() throws Exception {
        ArgumentCaptor<Employee> employeeCaptor = prepareImportMocks();

        invokeImportSingleRow(rowWithName("Daw Thu Zar", "Male"));

        assertEquals("Daw Thu Zar", employeeCaptor.getValue().getEmployeeName());
    }

    private ArgumentCaptor<Employee> prepareImportMocks() {
        Role role = new Role();
        role.setId(4L);
        role.setName("Employee");

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        when(employeeRepository.save(employeeCaptor.capture())).thenAnswer(invocation -> {
            Employee employee = invocation.getArgument(0);
            employee.setId(100L);
            return employee;
        });
        when(positionRoleResolutionService.resolveRoleFromPositionId(anyLong())).thenReturn(role);
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        return employeeCaptor;
    }

    @SuppressWarnings("unchecked")
    private void invokeImportSingleRow(Map<String, Object> row) throws Exception {
        Department department = new Department();
        department.setId(1L);
        department.setName("IT");

        Position position = new Position();
        position.setId(1L);
        position.setName("Developer");

        StaffType staffType = new StaffType();
        staffType.setId(1L);
        staffType.setName("Permanent");

        Method method = EmployeeImportCommitService.class.getDeclaredMethod(
                "importSingleRow",
                Map.class,
                Map.class,
                Map.class,
                Map.class,
                UserPrincipal.class);
        method.setAccessible(true);
        method.invoke(
                service,
                row,
                Map.of("it", department),
                Map.of("developer", position),
                Map.of("permanent", staffType),
                principal());
    }

    private UserPrincipal principal() {
        User user = new User();
        user.setId(1L);
        Role role = new Role();
        role.setId(1L);
        role.setName("HR");
        user.setRole(role);
        user.setPassword("pw");
        user.setActive(true);
        return new UserPrincipal(user);
    }

    private Map<String, Object> rowWithName(String fullName, String gender) {
        Map<String, Object> row = new HashMap<>();
        row.put("staffNo", "1001");
        row.put("fullName", fullName);
        row.put("staffNrcNo", "12/TAMANA(N)123456");
        row.put("email", "test.employee@example.com");
        row.put("department", "IT");
        row.put("position", "Developer");
        row.put("phoneNumber", "09123456789");
        row.put("gender", gender);
        row.put("dateOfBirth", "1990-01-01");
        row.put("hireDate", "2024-01-01");
        row.put("staffType", "Permanent");
        row.put("probationStartDate", "");
        row.put("probationEndDate", "");
        row.put("address", "Yangon");
        row.put("race", "Bamar");
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
