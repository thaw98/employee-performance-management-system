package com.epms.backend.service;

import com.epms.backend.dto.FeedbackHistoryDto;
import com.epms.backend.dto.FeedbackDetailPageDto;
import com.epms.backend.dto.FeedbackAuditEvaluateeHistoryDto;
import com.epms.backend.dto.FeedbackAuditHistoryFilter;
import com.epms.backend.dto.FeedbackAuditSummaryPageDto;
import com.epms.backend.entity.Criteria;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Feedback;
import com.epms.backend.entity.FeedbackDetail;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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

    @Test
    void auditSummaryGroupsEvaluateesAndCalculatesTotals() {
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

        Employee evaluatorOne = employee(10L, "E010", "Evaluator One", "Engineer", "Product");
        Employee evaluatorTwo = employee(11L, "E011", "Evaluator Two", "Analyst", "Product");
        Employee evaluatee = employee(20L, "E020", "Evaluatee User", "Lead", "Product");
        Feedback anonymous = feedback(1L, evaluatorOne, evaluatee, "PEER", true);
        anonymous.setScore(80.0);
        Feedback named = feedback(2L, evaluatorTwo, evaluatee, "MANAGER", false);
        named.setScore(90.0);

        when(feedbackRepository.findAll(any(Specification.class))).thenReturn(List.of(anonymous, named));

        FeedbackAuditSummaryPageDto page = service.getAuditHistorySummary(new FeedbackAuditHistoryFilter(), PageRequest.of(0, 10));

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getTotals().getTotalEvaluatees()).isEqualTo(1);
        assertThat(page.getTotals().getTotalFeedbackCount()).isEqualTo(2);
        assertThat(page.getTotals().getAnonymousCount()).isEqualTo(1);
        assertThat(page.getTotals().getNonAnonymousCount()).isEqualTo(1);
        assertThat(page.getTotals().getAverageScore()).isEqualTo(85.0);
        assertThat(page.getContent().get(0).getEmployeeName()).isEqualTo("Evaluatee User");
        assertThat(page.getContent().get(0).getFeedbackCount()).isEqualTo(2);
    }

    @Test
    void auditEvaluateeHistoryKeepsRealEvaluatorIdentityForAnonymousFeedback() {
        FeedbackRepository feedbackRepository = mock(FeedbackRepository.class);
        EmployeeRepository employeeRepository = mock(EmployeeRepository.class);
        FeedbackService service = new FeedbackService(
                feedbackRepository,
                mock(FeedbackDraftRepository.class),
                employeeRepository,
                mock(ReportingManagerResolver.class),
                mock(CriteriaRepository.class),
                mock(UserRepository.class),
                mock(NotificationService.class),
                mock(TimeSettingService.class),
                mock(ReviewCycleService.class),
                mock(ReviewCycleRepository.class),
                mock(AuditService.class));

        Employee evaluator = employee(10L, "E010", "Real Evaluator", "Engineer", "Product");
        Employee evaluatee = employee(20L, "E020", "Evaluatee User", "Lead", "Product");
        Feedback anonymous = feedback(1L, evaluator, evaluatee, "PEER", true);

        when(employeeRepository.findById(20L)).thenReturn(Optional.of(evaluatee));
        when(feedbackRepository.findAll(any(Specification.class))).thenReturn(List.of(anonymous));

        FeedbackAuditEvaluateeHistoryDto result = service.getAuditEvaluateeHistory(20L, new FeedbackAuditHistoryFilter(), PageRequest.of(0, 10));

        assertThat(result.getHistory().getContent()).hasSize(1);
        FeedbackHistoryDto row = result.getHistory().getContent().get(0);
        assertThat(row.getEvaluatorName()).isEqualTo("Real Evaluator");
        assertThat(row.getEvaluatorStaffNo()).isEqualTo("E010");
        assertThat(row.getAnonymous()).isTrue();
    }

    @Test
    void detailPageAllowsFeedbackEvaluatorAndIncludesDetails() {
        FeedbackRepository feedbackRepository = mock(FeedbackRepository.class);
        FeedbackService service = newService(feedbackRepository, mock(EmployeeRepository.class));
        Employee evaluator = employee(10L, "E010", "Evaluator", "Engineer", "Product");
        Employee evaluatee = employee(20L, "E020", "Evaluatee", "Analyst", "Product");
        Feedback feedback = feedback(1L, evaluator, evaluatee, "PEER", false);
        feedback.setDetails(List.of(detail(feedback, "Communication", 5, "Clear")));
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));

        FeedbackDetailPageDto result = service.getFeedbackDetailPage(1L, 10L);

        assertThat(result.getDirection()).isEqualTo("GIVEN");
        assertThat(result.getEvaluatorName()).isEqualTo("Evaluator");
        assertThat(result.getEvaluateeName()).isEqualTo("Evaluatee");
        assertThat(result.getDetails()).hasSize(1);
        assertThat(result.getDetails().get(0).getCriteriaName()).isEqualTo("Communication");
    }

    @Test
    void detailPageAllowsFeedbackRecipientAndMasksAnonymousEvaluator() {
        FeedbackRepository feedbackRepository = mock(FeedbackRepository.class);
        FeedbackService service = newService(feedbackRepository, mock(EmployeeRepository.class));
        Employee evaluator = employee(10L, "E010", "Evaluator", "Engineer", "Product");
        Employee evaluatee = employee(20L, "E020", "Evaluatee", "Analyst", "Product");
        Feedback feedback = feedback(1L, evaluator, evaluatee, "MANAGER", true);
        feedback.setDetails(List.of(detail(feedback, "Leadership", 4, "Helpful")));
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));

        FeedbackDetailPageDto result = service.getFeedbackDetailPage(1L, 20L);

        assertThat(result.getDirection()).isEqualTo("RECEIVED");
        assertThat(result.getEvaluatorName()).isEqualTo("Anonymous");
        assertThat(result.getEvaluatorStaffNo()).isNull();
        assertThat(result.getEvaluatorPosition()).isNull();
        assertThat(result.getEvaluatorDepartment()).isNull();
        assertThat(result.getDetails()).hasSize(1);
    }

    @Test
    void detailPageRejectsUnrelatedEmployee() {
        FeedbackRepository feedbackRepository = mock(FeedbackRepository.class);
        FeedbackService service = newService(feedbackRepository, mock(EmployeeRepository.class));
        Feedback feedback = feedback(1L,
                employee(10L, "E010", "Evaluator", "Engineer", "Product"),
                employee(20L, "E020", "Evaluatee", "Analyst", "Product"),
                "PEER",
                false);
        feedback.setDetails(List.of());
        when(feedbackRepository.findById(1L)).thenReturn(Optional.of(feedback));

        assertThatThrownBy(() -> service.getFeedbackDetailPage(1L, 30L))
                .isInstanceOf(SecurityException.class)
                .hasMessage("Access denied");
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

    private static FeedbackDetail detail(Feedback feedback, String criteriaName, int rating, String comment) {
        Criteria criteria = new Criteria();
        criteria.setName(criteriaName);
        FeedbackDetail detail = new FeedbackDetail();
        detail.setFeedback(feedback);
        detail.setCriteria(criteria);
        detail.setRating(rating);
        detail.setComment(comment);
        return detail;
    }

    private static FeedbackService newService(FeedbackRepository feedbackRepository, EmployeeRepository employeeRepository) {
        return new FeedbackService(
                feedbackRepository,
                mock(FeedbackDraftRepository.class),
                employeeRepository,
                mock(ReportingManagerResolver.class),
                mock(CriteriaRepository.class),
                mock(UserRepository.class),
                mock(NotificationService.class),
                mock(TimeSettingService.class),
                mock(ReviewCycleService.class),
                mock(ReviewCycleRepository.class),
                mock(AuditService.class));
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
