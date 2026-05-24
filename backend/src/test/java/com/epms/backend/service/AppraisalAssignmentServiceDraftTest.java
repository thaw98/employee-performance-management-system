package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.dto.EvaluationRequest;
import com.epms.backend.entity.AppraisalAssignment;
import com.epms.backend.entity.AppraisalAnswer;
import com.epms.backend.entity.AppraisalQuestion;
import com.epms.backend.entity.AppraisalStatus;
import com.epms.backend.entity.AppraisalTemplate;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Notification;
import com.epms.backend.entity.User;
import com.epms.backend.repository.AppraisalAnswerRepository;
import com.epms.backend.repository.AppraisalAssignmentRepository;
import com.epms.backend.repository.AppraisalQuestionRepository;
import com.epms.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AppraisalAssignmentServiceDraftTest {

    @Mock
    private AppraisalAssignmentRepository appraisalAssignmentRepository;
    @Mock
    private AppraisalAnswerRepository appraisalAnswerRepository;
    @Mock
    private AppraisalQuestionRepository appraisalQuestionRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    private AppraisalAssignmentService appraisalAssignmentService;

    @BeforeEach
    void setUp() {
        appraisalAssignmentService = new AppraisalAssignmentService(
            appraisalAssignmentRepository,
            appraisalAnswerRepository,
            appraisalQuestionRepository,
            auditService,
            userRepository,
            notificationService
        );
    }

    @Test
    void saveDraft_persistsAnswersCommentsAndSignatureWithoutChangingStatus() {
        AppraisalAssignment assignment = editableAssignment(AppraisalStatus.RETURNED);
        assignment.setSubmittedAt(java.time.Instant.parse("2026-05-01T00:00:00Z"));
        assignment.setManagerSignedAt(java.time.Instant.parse("2026-05-01T00:00:00Z"));
        assignment.setTotalScore(99.0);
        assignment.setRatingCategory("EXCEPTIONAL");
        AppraisalQuestion question = question(101L);

        when(appraisalAssignmentRepository.findById(eq(7L))).thenReturn(Optional.of(assignment));
        when(appraisalQuestionRepository.findById(eq(101L))).thenReturn(Optional.of(question));
        when(appraisalAssignmentRepository.save(any(AppraisalAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AppraisalAssignment result = appraisalAssignmentService.saveDraft(7L, request(101L, 3.0, "Draft note", "Manager comments", "sig"));

        assertEquals(AppraisalStatus.RETURNED, result.getStatus());
        assertEquals(1, result.getAnswers().size());
        assertEquals(3, result.getAnswers().get(0).getRating());
        assertEquals("Draft note", result.getAnswers().get(0).getComments());
        assertEquals("Manager comments", result.getManagerComments());
        assertEquals("sig", result.getManagerSignature());
        assertNotNull(result.getSubmittedAt());
        assertNotNull(result.getManagerSignedAt());
        assertEquals(60.0, result.getTotalScore());
        assertEquals("AVERAGE", result.getRatingCategory());
        verify(notificationService, never()).send(any(User.class), any(), any(), any(), any());
    }

    @Test
    void saveDraft_rejectsNonEditableStatuses() {
        AppraisalAssignment assignment = editableAssignment(AppraisalStatus.SUBMITTED);
        when(appraisalAssignmentRepository.findById(eq(7L))).thenReturn(Optional.of(assignment));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
            appraisalAssignmentService.saveDraft(7L, request(101L, 3.0, "Draft note", "Manager comments", null))
        );

        assertEquals("Draft can only be saved for pending or returned appraisals.", ex.getMessage());
    }

    @Test
    void submitEvaluation_changesStatusAndSetsSubmitTimestamps() {
        AppraisalAssignment assignment = editableAssignment(AppraisalStatus.PENDING_MANAGER);
        AppraisalQuestion question = question(101L);

        when(appraisalAssignmentRepository.findById(eq(7L))).thenReturn(Optional.of(assignment));
        when(appraisalQuestionRepository.findById(eq(101L))).thenReturn(Optional.of(question));
        when(appraisalAssignmentRepository.save(any(AppraisalAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.findByRole_IdAndActiveTrue(eq(1L))).thenReturn(List.of());

        AppraisalAssignment result = appraisalAssignmentService.submitEvaluation(
            7L,
            request(101L, 5.0, "Final note", "Final comments", "sig"),
            22L,
            2L
        );

        assertEquals(AppraisalStatus.SUBMITTED, result.getStatus());
        assertEquals("Final comments", result.getManagerComments());
        assertEquals("sig", result.getManagerSignature());
        assertNotNull(result.getSubmittedAt());
        assertNotNull(result.getManagerSignedAt());
        assertEquals(100.0, result.getTotalScore());
        assertEquals("EXCEPTIONAL", result.getRatingCategory());
    }

    @Test
    void saveDraft_recalculatesEmptyDraftToClearStaleScore() {
        AppraisalAssignment assignment = editableAssignment(AppraisalStatus.RETURNED);
        assignment.setTotalScore(88.0);
        assignment.setRatingCategory("GOOD");

        when(appraisalAssignmentRepository.findById(eq(7L))).thenReturn(Optional.of(assignment));
        when(appraisalAssignmentRepository.save(any(AppraisalAssignment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        EvaluationRequest request = new EvaluationRequest();
        request.setAnswers(List.of());
        request.setComments("No ratings yet");

        AppraisalAssignment result = appraisalAssignmentService.saveDraft(7L, request);

        assertNull(result.getTotalScore());
        assertNull(result.getRatingCategory());
    }

    private static AppraisalAssignment editableAssignment(AppraisalStatus status) {
        AppraisalAssignment assignment = new AppraisalAssignment();
        assignment.setId(7L);
        assignment.setStatus(status);
        assignment.setEmployee(new Employee());
        AppraisalTemplate template = new AppraisalTemplate();
        template.setMaxRating(5);
        assignment.setTemplate(template);

        AppraisalAnswer oldAnswer = new AppraisalAnswer();
        oldAnswer.setAssignment(assignment);
        oldAnswer.setQuestion(question(99L));
        oldAnswer.setRating(5);
        oldAnswer.setComments("Old answer");
        assignment.getAnswers().add(oldAnswer);

        return assignment;
    }

    private static AppraisalQuestion question(Long id) {
        AppraisalQuestion question = new AppraisalQuestion();
        question.setId(id);
        question.setQuestionText("Question " + id);
        return question;
    }

    private static EvaluationRequest request(Long questionId, Double rating, String answerComments, String comments, String signature) {
        EvaluationRequest request = new EvaluationRequest();
        EvaluationRequest.AnswerRequest answer = new EvaluationRequest.AnswerRequest();
        answer.setQuestionId(questionId);
        answer.setRating(rating);
        answer.setComments(answerComments);
        request.setAnswers(List.of(answer));
        request.setComments(comments);
        request.setSignature(signature);
        return request;
    }
}
