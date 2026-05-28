package com.epms.backend.service;

import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Feedback;
import com.epms.backend.entity.Position;
import com.epms.backend.repository.CriteriaRepository;
import com.epms.backend.repository.EmployeeRepository;
import com.epms.backend.repository.FeedbackDraftRepository;
import com.epms.backend.repository.FeedbackRepository;
import com.epms.backend.repository.ReviewCycleRepository;
import com.epms.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FeedbackServiceCombinedHistoryTest {

    @Test
    void combinedHistoryMapsGivenAndReceivedRowsWithAnonymousRules() {
        FeedbackRepository feedbackRepository = mock(FeedbackRepository.class);
        FeedbackService service = new FeedbackService(
                feedbackRepository,
                mock(FeedbackDraftRepository.class),
                mock(EmployeeRepository.class),
                mock(ReportingManagerResolver.class),
                mock(CriteriaRepository.class),
                mock(UserRepository.class),
                mock(NotificationService.class),
                mock(TimeSettingService.class),
                mock(ReviewCycleService.class),
                mock(ReviewCycleRepository.class),
                mock(AuditService.class));

        Employee current = employee(10L, "E010", "Current User", "Engineer", "Product");
        Employee colleague = employee(20L, "E020", "Colleague User", "Analyst", "Product");
        Employee manager = employee(30L, "E030", "Manager User", "Manager", "Product");

        Feedback givenAnonymous = feedback(1L, current, colleague, "PEER", true);
        Feedback receivedAnonymous = feedback(2L, manager, current, "MANAGER", true);

        when(feedbackRepository.findAll(any(Specification.class), eq(PageRequest.of(0, 10))))
                .thenReturn(new PageImpl<>(List.of(givenAnonymous, receivedAnonymous)));

        Page<FeedbackHistoryDto> page = service.getCombinedFeedbackHistory(10L, null, PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(2);

        FeedbackHistoryDto given = page.getContent().get(0);
        assertThat(given.getDirection()).isEqualTo("GIVEN");
        assertThat(given.getEvaluatorName()).isEqualTo("Current User");
        assertThat(given.getEvaluatorStaffNo()).isEqualTo("E010");
        assertThat(given.getEvaluatorPosition()).isEqualTo("Engineer");
        assertThat(given.getEvaluatorDepartment()).isEqualTo("Product");

        FeedbackHistoryDto received = page.getContent().get(1);
        assertThat(received.getDirection()).isEqualTo("RECEIVED");
        assertThat(received.getEvaluatorName()).isEqualTo("Anonymous");
        assertThat(received.getEvaluatorStaffNo()).isNull();
        assertThat(received.getEvaluatorPosition()).isNull();
        assertThat(received.getEvaluatorDepartment()).isNull();
    }

    private static Feedback feedback(Long id, Employee evaluator, Employee evaluatee, String role, boolean anonymous) {
        Feedback feedback = new Feedback();
        feedback.setId(id);
        feedback.setEvaluator(evaluator);
        feedback.setEvaluatee(evaluatee);
        feedback.setRole(role);
        feedback.setAnonymous(anonymous);
        feedback.setCreatedDate(Instant.parse("2026-05-01T10:00:00Z"));
        feedback.setScore(82.0);
        feedback.setRemark("Good");
        return feedback;
    }

    private static Employee employee(Long id, String staffNo, String name, String positionName, String departmentName) {
        Employee employee = new Employee();
        employee.setId(id);
        employee.setEmployeeId(staffNo);
        employee.setEmployeeName(name);

        Position position = new Position();
        position.setName(positionName);
        employee.setPosition(position);

        Department department = new Department();
        department.setName(departmentName);
        employee.setDepartment(department);

        return employee;
    }
}
