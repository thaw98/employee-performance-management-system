package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.QuestionBankRequest;
import com.epms.backend.entity.Department;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.QuestionBank;
import com.epms.backend.entity.User;
import com.epms.backend.repository.QuestionBankRepository;
import com.epms.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class QuestionBankServiceTest {

    private final QuestionBankRepository questionBankRepository = mock(QuestionBankRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final QuestionBankService service = new QuestionBankService(questionBankRepository, userRepository, auditService);

    @Test
    void createQuestionTrimsTextAndStoresActiveQuestion() {
        when(questionBankRepository.findByNormalizedQuestionTextInScope("lead effectively", 1L, null)).thenReturn(Optional.empty());
        when(questionBankRepository.save(any(QuestionBank.class))).thenAnswer(invocation -> {
            QuestionBank question = invocation.getArgument(0);
            question.setId(10L);
            return question;
        });

        var result = service.createQuestion(new QuestionBankRequest("  Lead effectively  ", true), 1L, 1L);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.questionText()).isEqualTo("Lead effectively");
        assertThat(result.isActive()).isTrue();
        assertThat(result.ownerRoleId()).isEqualTo(1L);
        assertThat(result.departmentId()).isNull();
    }

    @Test
    void createQuestionRejectsTrimAndCaseInsensitiveDuplicate() {
        QuestionBank existing = new QuestionBank();
        existing.setId(5L);
        existing.setQuestionText("Lead effectively");
        existing.setOwnerRoleId(1L);
        when(questionBankRepository.findByNormalizedQuestionTextInScope("lead effectively", 1L, null)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.createQuestion(new QuestionBankRequest("  LEAD EFFECTIVELY  ", true), 1L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("A question with this text already exists");

        verify(questionBankRepository, never()).save(any(QuestionBank.class));
    }

    @Test
    void updateQuestionAllowsSameRecordButRejectsAnotherDuplicate() {
        QuestionBank current = new QuestionBank();
        current.setId(5L);
        current.setQuestionText("Original");
        current.setActive(true);
        current.setOwnerRoleId(1L);

        QuestionBank duplicate = new QuestionBank();
        duplicate.setId(6L);
        duplicate.setQuestionText("Updated");
        duplicate.setOwnerRoleId(1L);

        when(questionBankRepository.findById(5L)).thenReturn(Optional.of(current));
        when(questionBankRepository.findByNormalizedQuestionTextInScope("updated", 1L, null)).thenReturn(Optional.of(duplicate));

        assertThatThrownBy(() -> service.updateQuestion(5L, new QuestionBankRequest("Updated", true), 1L, 1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("A question with this text already exists");

        verify(questionBankRepository, never()).save(any(QuestionBank.class));
    }

    @Test
    void listQuestionsDefaultsToActiveOnlyWhenRequested() {
        QuestionBank active = new QuestionBank();
        active.setId(1L);
        active.setQuestionText("Active question");
        active.setActive(true);
        active.setOwnerRoleId(1L);
        when(questionBankRepository.findActiveByBankScopeOrderByCreatedOnDesc(1L, null)).thenReturn(List.of(active));

        var result = service.getQuestions(false, 1L, 1L);

        assertThat(result).singleElement().extracting("questionText").isEqualTo("Active question");
        verify(questionBankRepository, never()).findByBankScopeOrderByCreatedOnDesc(anyLong(), isNull());
    }

    @Test
    void departmentHeadSeesOnlyOwnDepartmentQuestionsIncludingInactiveWhenRequested() {
        Department sales = department(10L, "Sales");
        QuestionBank inactive = new QuestionBank();
        inactive.setId(11L);
        inactive.setQuestionText("Sales goal");
        inactive.setActive(false);
        inactive.setOwnerRoleId(2L);
        inactive.setDepartment(sales);
        when(userRepository.findByIdWithEmployeeDepartment(2L)).thenReturn(Optional.of(userWithDepartment(sales)));
        when(questionBankRepository.findByBankScopeOrderByCreatedOnDesc(2L, 10L)).thenReturn(List.of(inactive));

        var result = service.getQuestions(true, 2L, 2L);

        assertThat(result).singleElement().satisfies(question -> {
            assertThat(question.questionText()).isEqualTo("Sales goal");
            assertThat(question.ownerRoleId()).isEqualTo(2L);
            assertThat(question.departmentId()).isEqualTo(10L);
            assertThat(question.departmentName()).isEqualTo("Sales");
        });
    }

    @Test
    void departmentHeadCannotMutateAnotherDepartmentQuestion() {
        Department sales = department(10L, "Sales");
        Department finance = department(20L, "Finance");
        QuestionBank financeQuestion = new QuestionBank();
        financeQuestion.setId(9L);
        financeQuestion.setQuestionText("Finance question");
        financeQuestion.setOwnerRoleId(2L);
        financeQuestion.setDepartment(finance);
        when(userRepository.findByIdWithEmployeeDepartment(2L)).thenReturn(Optional.of(userWithDepartment(sales)));
        when(questionBankRepository.findById(9L)).thenReturn(Optional.of(financeQuestion));

        assertThatThrownBy(() -> service.updateStatus(9L, false, 2L, 2L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Question bank item not found");

        verify(questionBankRepository, never()).save(any(QuestionBank.class));
    }

    @Test
    void duplicateTextIsScopedByOwnerRoleAndDepartment() {
        Department sales = department(10L, "Sales");
        when(userRepository.findByIdWithEmployeeDepartment(2L)).thenReturn(Optional.of(userWithDepartment(sales)));
        when(questionBankRepository.findByNormalizedQuestionTextInScope("lead effectively", 2L, 10L))
                .thenReturn(Optional.empty());
        when(questionBankRepository.save(any(QuestionBank.class))).thenAnswer(invocation -> {
            QuestionBank question = invocation.getArgument(0);
            question.setId(12L);
            return question;
        });

        var result = service.createQuestion(new QuestionBankRequest("Lead effectively", true), 2L, 2L);

        assertThat(result.ownerRoleId()).isEqualTo(2L);
        assertThat(result.departmentId()).isEqualTo(10L);
        verify(questionBankRepository).findByNormalizedQuestionTextInScope("lead effectively", 2L, 10L);
    }

    @Test
    void roleThreeIsRejected() {
        assertThatThrownBy(() -> service.getQuestions(false, 3L, 3L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("You do not have access to the question bank");
    }

    @Test
    void departmentHeadWithoutDepartmentIsRejected() {
        when(userRepository.findByIdWithEmployeeDepartment(2L)).thenReturn(Optional.of(userWithDepartment(null)));

        assertThatThrownBy(() -> service.createQuestion(new QuestionBankRequest("Question", true), 2L, 2L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Department is required to access the question bank");

        verify(questionBankRepository, never()).save(any(QuestionBank.class));
    }

    private static Department department(Long id, String name) {
        Department department = new Department();
        department.setId(id);
        department.setName(name);
        return department;
    }

    private static User userWithDepartment(Department department) {
        Employee employee = new Employee();
        employee.setDepartment(department);
        User user = new User();
        user.setEmployee(employee);
        return user;
    }
}
