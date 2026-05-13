package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.StaffTypes;
import com.epms.backend.dto.FeedbackSubmissionRequest;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.StaffType;
import com.epms.backend.repository.CriteriaRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FeedbackRepository;
import com.epms.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceProbationRuleTest {

    @Mock
    private FeedbackRepository feedbackRepository;
    @Mock
    private EmployeeRepository employeeRepository;
    @Mock
    private ReportingManagerResolver reportingManagerResolver;
    @Mock
    private CriteriaRepository criteriaRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private TimeSettingService timeSettingService;

    private FeedbackService feedbackService;

    @BeforeEach
    void setUp() {
        feedbackService = new FeedbackService(
                feedbackRepository,
                employeeRepository,
                reportingManagerResolver,
                criteriaRepository,
                userRepository,
                notificationService,
                timeSettingService);
    }

    @Test
    void getEligibleEvaluatees_excludesProbationEmployees() {
        Employee evaluator = new Employee();
        evaluator.setId(10L);
        evaluator.setDepartment(newDepartment(1L));
        evaluator.setPosition(TestFixtures.newPositionWithLevel(3L));

        Employee permanentPeer = new Employee();
        permanentPeer.setId(11L);
        permanentPeer.setDepartment(newDepartment(1L));
        permanentPeer.setPosition(TestFixtures.newPositionWithLevel(3L));
        permanentPeer.setStaffType(newStaffType(StaffTypes.PERMANENT));

        Employee probationPeer = new Employee();
        probationPeer.setId(12L);
        probationPeer.setDepartment(newDepartment(1L));
        probationPeer.setPosition(TestFixtures.newPositionWithLevel(3L));
        probationPeer.setStaffType(newStaffType(StaffTypes.PROBATION));

        when(employeeRepository.findById(eq(10L))).thenReturn(Optional.of(evaluator));
        when(employeeRepository.findByDepartmentId(eq(1L))).thenReturn(List.of(evaluator, permanentPeer, probationPeer));

        List<Employee> result = feedbackService.getEligibleEvaluatees(10L, "PEER");

        assertEquals(1, result.size());
        assertEquals(11L, result.get(0).getId());
    }

    @Test
    void submitFeedback_throwsForProbationEvaluatee() {
        Employee evaluator = new Employee();
        evaluator.setId(10L);
        evaluator.setDepartment(newDepartment(1L));

        Employee probationEvaluatee = new Employee();
        probationEvaluatee.setId(12L);
        probationEvaluatee.setDepartment(newDepartment(1L));
        probationEvaluatee.setStaffType(newStaffType(StaffTypes.PROBATION));

        FeedbackSubmissionRequest request = new FeedbackSubmissionRequest();
        request.setEvaluateeId(12L);
        request.setRole("PEER");

        when(employeeRepository.findById(eq(10L))).thenReturn(Optional.of(evaluator));
        when(employeeRepository.findById(eq(12L))).thenReturn(Optional.of(probationEvaluatee));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> feedbackService.submitFeedback(10L, request));
        assertEquals("Probation employees cannot receive 360 feedback", ex.getMessage());
    }

    private static Department newDepartment(Long id) {
        Department department = new Department();
        department.setId(id);
        return department;
    }

    private static StaffType newStaffType(long id) {
        StaffType staffType = new StaffType();
        staffType.setId(id);
        return staffType;
    }

    private static final class TestFixtures {
        private TestFixtures() {
        }

        private static com.epms.backend.entity.Position newPositionWithLevel(Long levelId) {
            com.epms.backend.entity.Position position = new com.epms.backend.entity.Position();
            com.epms.backend.entity.LevelCode levelCode = new com.epms.backend.entity.LevelCode();
            levelCode.setId(levelId);
            position.setLevelCode(levelCode);
            return position;
        }
    }
}
