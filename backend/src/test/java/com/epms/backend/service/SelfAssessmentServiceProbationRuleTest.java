package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.StaffTypes;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.SelfAssessment;
import com.epms.backend.entity.StaffType;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.SelfAssessmentRepository;
import com.epms.backend.repository.SelfAssessmentSubjectRepository;
import com.epms.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class SelfAssessmentServiceProbationRuleTest {

    @Mock
    private SelfAssessmentRepository selfAssessmentRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SelfAssessmentSubjectRepository subjectRepository;
    @Mock
    private NotificationService notificationService;

    private SelfAssessmentService selfAssessmentService;

    @BeforeEach
    void setUp() {
        selfAssessmentService = new SelfAssessmentService(
                selfAssessmentRepository,
                employeeRepository,
                userRepository,
                subjectRepository,
                notificationService);
    }

    @Test
    void getEmployeeSelfAssessments_returnsEmptyForProbationEmployee() {
        Employee probationEmployee = newEmployee(2L, StaffTypes.PROBATION);

        List<SelfAssessment> result = selfAssessmentService.getEmployeeSelfAssessments(probationEmployee);

        assertTrue(result.isEmpty());
    }

    @Test
    void createAssignment_throwsForProbationEmployee() {
        Employee probationEmployee = newEmployee(2L, StaffTypes.PROBATION);

        when(employeeRepository.findById(eq(2L))).thenReturn(Optional.of(probationEmployee));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> selfAssessmentService.createAssignment(probationEmployee));
        assertEquals("Probation employees cannot be assigned to self-assessment", ex.getMessage());
    }

    @Test
    void createForAllEmployees_skipsProbationEmployees() {
        Employee permanentEmployee = newEmployee(1L, StaffTypes.PERMANENT);
        Employee probationEmployee = newEmployee(2L, StaffTypes.PROBATION);

        when(employeeRepository.findAll()).thenReturn(List.of(permanentEmployee, probationEmployee));
        when(employeeRepository.findById(eq(1L))).thenReturn(Optional.of(permanentEmployee));
        when(selfAssessmentRepository.save(any(SelfAssessment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        selfAssessmentService.createForAllEmployees();

        verify(selfAssessmentRepository).save(any(SelfAssessment.class));
    }

    private static Employee newEmployee(Long id, long staffTypeId) {
        Employee employee = new Employee();
        employee.setId(id);
        StaffType staffType = new StaffType();
        staffType.setId(staffTypeId);
        employee.setStaffType(staffType);
        return employee;
    }
}
