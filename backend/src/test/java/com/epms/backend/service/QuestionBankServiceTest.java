package com.epms.backend.service;

import com.epms.backend.dto.selfassessmentform.QuestionBankRequest;
import com.epms.backend.entity.QuestionBank;
import com.epms.backend.repository.QuestionBankRepository;
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
    private final AuditService auditService = mock(AuditService.class);
    private final QuestionBankService service = new QuestionBankService(questionBankRepository, auditService);

    @Test
    void createQuestionTrimsTextAndStoresActiveQuestion() {
        when(questionBankRepository.findByNormalizedQuestionText("lead effectively")).thenReturn(Optional.empty());
        when(questionBankRepository.save(any(QuestionBank.class))).thenAnswer(invocation -> {
            QuestionBank question = invocation.getArgument(0);
            question.setId(10L);
            return question;
        });

        var result = service.createQuestion(new QuestionBankRequest("  Lead effectively  ", true), 1L, 1L);

        assertThat(result.id()).isEqualTo(10L);
        assertThat(result.questionText()).isEqualTo("Lead effectively");
        assertThat(result.isActive()).isTrue();
    }

    @Test
    void createQuestionRejectsTrimAndCaseInsensitiveDuplicate() {
        QuestionBank existing = new QuestionBank();
        existing.setId(5L);
        existing.setQuestionText("Lead effectively");
        when(questionBankRepository.findByNormalizedQuestionText("lead effectively")).thenReturn(Optional.of(existing));

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

        QuestionBank duplicate = new QuestionBank();
        duplicate.setId(6L);
        duplicate.setQuestionText("Updated");

        when(questionBankRepository.findById(5L)).thenReturn(Optional.of(current));
        when(questionBankRepository.findByNormalizedQuestionText("updated")).thenReturn(Optional.of(duplicate));

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
        when(questionBankRepository.findByIsActiveTrueOrderByCreatedOnDesc()).thenReturn(List.of(active));

        var result = service.getQuestions(false);

        assertThat(result).singleElement().extracting("questionText").isEqualTo("Active question");
        verify(questionBankRepository, never()).findAllByOrderByCreatedOnDesc();
    }
}
