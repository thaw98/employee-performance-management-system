package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.pip.EligibleEmployeeDTO;
import com.epms.backend.dto.pip.PipCreateRequest;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeKpi;
import com.epms.backend.entity.StaffType;
import com.epms.backend.entity.User;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FollowUpMeetingRepository;
import com.epms.backend.repository.KpiRepository;
import com.epms.backend.repository.PipObjectiveRepository;
import com.epms.backend.repository.PipProgressUpdateRepository;
import com.epms.backend.repository.PipRepository;
import com.epms.backend.repository.PipCommunicationNoteRepository;
import com.epms.backend.repository.SignatureRepository;
import com.epms.backend.repository.TrainingRecordRepository;
import com.epms.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class PipServiceProbationRuleTest {

    @Mock
    private PipRepository pipRepository;
    @Mock
    private PipObjectiveRepository objectiveRepository;
    @Mock
    private PipProgressUpdateRepository progressUpdateRepository;
    @Mock
    private FollowUpMeetingRepository meetingRepository;
    @Mock
    private TrainingRecordRepository trainingRepository;
    @Mock
    private SignatureRepository signatureRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private PipCommunicationNoteRepository communicationNoteRepository;

    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private KpiRepository kpiRepository;

    private PipService pipService;

    @BeforeEach
    void setUp() {
        pipService = new PipService(
                pipRepository,
                objectiveRepository,
                progressUpdateRepository,
                meetingRepository,
                trainingRepository,
                employeeRepository,
                communicationNoteRepository,
                signatureRepository,
                notificationService,
                userRepository,
                kpiRepository);
    }

    @Test
    void getLowPerformers_excludesProbationEmployees() {
        Employee managerEmployee = new Employee();
        managerEmployee.setId(10L);

        User managerUser = new User();
        managerUser.setEmployee(managerEmployee);

        Employee permanent = new Employee();
        permanent.setId(1L);
        permanent.setEmployeeId("E001");
        permanent.setEmployeeName("Permanent Employee");
        permanent.setDepartment(newDepartment(99L, 10L));
        permanent.setStaffType(newStaffType(StaffTypes.PERMANENT));

        Employee probation = new Employee();
        probation.setId(2L);
        probation.setEmployeeId("E002");
        probation.setEmployeeName("Probation Employee");
        probation.setDepartment(newDepartment(99L, 10L));
        probation.setStaffType(newStaffType(StaffTypes.PROBATION));

        when(employeeRepository.findAll()).thenReturn(List.of(permanent, probation));
        when(kpiRepository.findLatestPeriodByEmployee_Id(1L)).thenReturn(Optional.of("May 2026"));
        when(kpiRepository.findByEmployee_IdAndPeriod(1L, "May 2026"))
                .thenReturn(List.of(newKpiTotalScore(new BigDecimal("20.99"))));

        List<EligibleEmployeeDTO> result = pipService.getLowPerformers(managerUser);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getEmployeeId());
        assertEquals(new BigDecimal("20.99"), result.get(0).getTotalScore());
    }

    @Test
    void getLowPerformers_excludesEmployeesWithKpiScoreAtOrAboveSixtyNinePercent() {
        Employee managerEmployee = new Employee();
        managerEmployee.setId(10L);

        User managerUser = new User();
        managerUser.setEmployee(managerEmployee);

        Employee lowPerformer = new Employee();
        lowPerformer.setId(1L);
        lowPerformer.setEmployeeId("E001");
        lowPerformer.setEmployeeName("Low Performer");
        lowPerformer.setDepartment(newDepartment(99L, 10L));
        lowPerformer.setStaffType(newStaffType(StaffTypes.PERMANENT));

        Employee ineligible = new Employee();
        ineligible.setId(2L);
        ineligible.setEmployeeId("E002");
        ineligible.setEmployeeName("Ineligible Employee");
        ineligible.setDepartment(newDepartment(99L, 10L));
        ineligible.setStaffType(newStaffType(StaffTypes.PERMANENT));

        when(employeeRepository.findAll()).thenReturn(List.of(lowPerformer, ineligible));
        when(kpiRepository.findLatestPeriodByEmployee_Id(1L)).thenReturn(Optional.of("May 2026"));
        when(kpiRepository.findByEmployee_IdAndPeriod(1L, "May 2026"))
                .thenReturn(List.of(newKpiTotalScore(new BigDecimal("68.99"))));
        when(kpiRepository.findLatestPeriodByEmployee_Id(2L)).thenReturn(Optional.of("May 2026"));
        when(kpiRepository.findByEmployee_IdAndPeriod(2L, "May 2026"))
                .thenReturn(List.of(newKpiTotalScore(new BigDecimal("69.00"))));

        List<EligibleEmployeeDTO> result = pipService.getLowPerformers(managerUser);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getEmployeeId());
    }

    @Test
    void getLowPerformers_includesSameDepartmentEmployeesBelowSixtyNinePercent() {
        Department department = newDepartment(99L, null);

        Employee managerEmployee = new Employee();
        managerEmployee.setId(10L);
        managerEmployee.setDepartment(department);

        User managerUser = new User();
        managerUser.setEmployee(managerEmployee);

        Employee employee = new Employee();
        employee.setId(1L);
        employee.setEmployeeId("E001");
        employee.setEmployeeName("Same Department Employee");
        employee.setDepartment(department);
        employee.setStaffType(newStaffType(StaffTypes.PERMANENT));

        when(employeeRepository.findAll()).thenReturn(List.of(employee));
        when(kpiRepository.findLatestPeriodByEmployee_Id(1L)).thenReturn(Optional.of("May 2026"));
        when(kpiRepository.findByEmployee_IdAndPeriod(1L, "May 2026"))
                .thenReturn(List.of(newKpiTotalScore(new BigDecimal("68.99"))));

        List<EligibleEmployeeDTO> result = pipService.getLowPerformers(managerUser);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getEmployeeId());
    }

    @Test
    void getLowPerformers_treatsExistingKpisWithoutScoresAsZeroPercent() {
        Employee managerEmployee = new Employee();
        managerEmployee.setId(10L);

        User managerUser = new User();
        managerUser.setEmployee(managerEmployee);

        Employee employee = new Employee();
        employee.setId(1L);
        employee.setEmployeeId("E001");
        employee.setEmployeeName("No Score Employee");
        employee.setDepartment(newDepartment(99L, 10L));
        employee.setStaffType(newStaffType(StaffTypes.PERMANENT));

        when(employeeRepository.findAll()).thenReturn(List.of(employee));
        when(kpiRepository.findLatestPeriodByEmployee_Id(1L)).thenReturn(Optional.of("May 2026"));
        when(kpiRepository.findByEmployee_IdAndPeriod(1L, "May 2026")).thenReturn(List.of(new EmployeeKpi()));

        List<EligibleEmployeeDTO> result = pipService.getLowPerformers(managerUser);

        assertEquals(1, result.size());
        assertEquals(BigDecimal.ZERO, result.get(0).getTotalScore());
    }

    @Test
    void createPip_throwsForProbationEmployee() {
        Employee managerEmployee = new Employee();
        managerEmployee.setId(10L);

        User managerUser = new User();
        managerUser.setEmployee(managerEmployee);

        Employee probation = new Employee();
        probation.setId(2L);
        probation.setDepartment(newDepartment(99L, 10L));
        probation.setStaffType(newStaffType(StaffTypes.PROBATION));

        PipCreateRequest request = new PipCreateRequest();
        request.setEmployeeId(2L);
        request.setStartDate(LocalDate.now());
        request.setEndDate(LocalDate.now().plusDays(30));
        request.setObjectives(List.of("Improve quality"));
        request.setExpectedImprovements("Improve quality within the PIP period");

        when(employeeRepository.findById(eq(2L))).thenReturn(Optional.of(probation));
        RuntimeException ex = assertThrows(RuntimeException.class, () -> pipService.createPip(request, managerUser));
        assertEquals("Probation employees cannot be assigned to PIP", ex.getMessage());
    }

    private static Department newDepartment(Long id, Long managerId) {
        Department department = new Department();
        department.setId(id);
        department.setManagerId(managerId);
        return department;
    }

    private static StaffType newStaffType(long id) {
        StaffType staffType = new StaffType();
        staffType.setId(id);
        return staffType;
    }

    private static EmployeeKpi newKpiTotalScore(BigDecimal score) {
        EmployeeKpi kpi = new EmployeeKpi();
        kpi.setKpiTotalScore(score);
        return kpi;
    }
}
