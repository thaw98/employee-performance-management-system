package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.dto.hr.AppraisalImportCommitRequestDto;
import com.epms.backend.dto.hr.AppraisalImportCommitResponseDto;
import com.epms.backend.dto.hr.AppraisalImportEditedRowDto;
import com.epms.backend.entity.AppraisalCategory;
import com.epms.backend.entity.AppraisalImportSession;
import com.epms.backend.entity.AppraisalImportSessionItem;
import com.epms.backend.entity.AppraisalQuestion;
import com.epms.backend.entity.AppraisalTemplate;
import com.epms.backend.entity.DepartmentPosition;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.AppraisalCategoryRepository;
import com.epms.backend.repository.AppraisalImportSessionItemRepository;
import com.epms.backend.repository.AppraisalImportSessionRepository;
import com.epms.backend.repository.AppraisalQuestionRepository;
import com.epms.backend.repository.AppraisalTemplateRepository;
import com.epms.backend.repository.DepartmentPositionRepository;
import com.epms.backend.security.UserPrincipal;

@ExtendWith(MockitoExtension.class)
class AppraisalImportCommitServiceTest {

    @Mock
    private AppraisalImportSessionRepository sessionRepository;
    @Mock
    private AppraisalImportSessionItemRepository itemRepository;
    @Mock
    private AppraisalCategoryRepository categoryRepository;
    @Mock
    private AppraisalQuestionRepository questionRepository;
    @Mock
    private AppraisalTemplateRepository templateRepository;
    @Mock
    private DepartmentPositionRepository departmentPositionRepository;

    private AppraisalImportCommitService service;

    @BeforeEach
    void setUp() {
        service = new AppraisalImportCommitService(
                sessionRepository,
                itemRepository,
                categoryRepository,
                questionRepository,
                templateRepository,
                departmentPositionRepository);
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

    private AppraisalImportSession validSession(boolean committed) {
        AppraisalImportSession session = new AppraisalImportSession();
        session.setId(1L);
        session.setValidationId("test-validation-uuid");
        session.setCommitted(committed);
        session.setValidRows(2);
        session.setTotalRows(2);
        session.setInvalidRows(0);
        return session;
    }

    private List<AppraisalImportSessionItem> validItems() {
        List<AppraisalImportSessionItem> items = new ArrayList<>();
        AppraisalImportSessionItem item1 = new AppraisalImportSessionItem();
        item1.setId(1L);
        item1.setSessionId(1L);
        item1.setRowNumber(2);
        item1.setStatus("VALID");
        items.add(item1);

        AppraisalImportSessionItem item2 = new AppraisalImportSessionItem();
        item2.setId(2L);
        item2.setSessionId(1L);
        item2.setRowNumber(3);
        item2.setStatus("VALID");
        items.add(item2);
        return items;
    }

    private AppraisalImportCommitRequestDto validRequest() {
        AppraisalImportCommitRequestDto req = new AppraisalImportCommitRequestDto();
        req.setValidationId("test-validation-uuid");
        req.setTemplateName("Q1 2026 Appraisal");
        req.setAssessmentDate(LocalDate.of(2026, 1, 1));
        req.setEffectiveDate(LocalDate.of(2026, 1, 15));
        req.setDeadlineDate(LocalDate.of(2026, 2, 28));
        req.setReviewCycleId(1L);
        req.setMaxRating(5);
        req.setPositionIds(List.of(10L, 20L));
        req.setEditedRows(List.of(
                editedRow(2, "Communication", "Communication skills", "Active Listening"),
                editedRow(3, "Communication", "Communication skills", "Clear Writing")));
        return req;
    }

    private AppraisalImportEditedRowDto editedRow(int rowNumber, String catName, String catDesc, String questionText) {
        AppraisalImportEditedRowDto row = new AppraisalImportEditedRowDto();
        row.setRowNumber(rowNumber);
        row.setCategoryName(catName);
        row.setCategoryDescription(catDesc);
        row.setQuestionText(questionText);
        return row;
    }

    // --- Validation rejection tests ---

    @Test
    void commit_rejectsNullValidationId() {
        AppraisalImportCommitRequestDto req = validRequest();
        req.setValidationId(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().contains("validationId"));
    }

    @Test
    void commit_rejectsBlankValidationId() {
        AppraisalImportCommitRequestDto req = validRequest();
        req.setValidationId("   ");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().contains("validationId"));
    }

    @Test
    void commit_rejectsMissingTemplateName() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setTemplateName(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("template"));
    }

    @Test
    void commit_rejectsBlankTemplateName() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setTemplateName("   ");
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("template"));
    }

    @Test
    void commit_rejectsMissingAssessmentDate() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setAssessmentDate(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("assessment"));
    }

    @Test
    void commit_rejectsMissingEffectiveDate() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setEffectiveDate(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("effective"));
    }

    @Test
    void commit_rejectsMissingDeadlineDate() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setDeadlineDate(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("deadline"));
    }

    @Test
    void commit_rejectsNoPositions() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setPositionIds(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("position"));
    }

    @Test
    void commit_rejectsEmptyPositions() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setPositionIds(List.of());
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("position"));
    }

    @Test
    void commit_rejectsInvalidMaxRating() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setMaxRating(null);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("max rating"));
    }

    @Test
    void commit_rejectsMaxRatingBelow1() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setMaxRating(0);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("max rating"));
    }

    @Test
    void commit_rejectsMaxRatingAbove10() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        AppraisalImportCommitRequestDto req = validRequest();
        req.setMaxRating(11);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().toLowerCase().contains("max rating"));
    }

    @Test
    void commit_rejectsAlreadyCommittedSession() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(true)));

        AppraisalImportCommitRequestDto req = validRequest();
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().contains("already been committed"));
    }

    @Test
    void commit_rejectsBlankCategoryNameInEditedRow() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));

        AppraisalImportCommitRequestDto req = validRequest();
        req.setEditedRows(List.of(
                editedRow(2, "   ", "Desc", "Question"),
                editedRow(3, "Communication", "Desc", "Another Question")));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().contains("Category name cannot be blank"));
    }

    @Test
    void commit_rejectsBlankQuestionTextInEditedRow() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));

        AppraisalImportCommitRequestDto req = validRequest();
        req.setEditedRows(List.of(
                editedRow(2, "Communication", "Desc", "   "),
                editedRow(3, "Communication", "Desc", "Valid Question")));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().contains("Question text cannot be blank"));
    }

    @Test
    void commit_rejectsEditedRowsCountMismatch() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));

        AppraisalImportCommitRequestDto req = validRequest();
        req.setEditedRows(List.of(
                editedRow(2, "Communication", "Desc", "Q1"))); // only 1, session has 2

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().contains("does not match"));
    }

    @Test
    void commit_rejectsDuplicateCategoryQuestionPair() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));

        AppraisalImportCommitRequestDto req = validRequest();
        req.setEditedRows(List.of(
                editedRow(2, "Communication", "Desc", "Same Question"),
                editedRow(3, "Communication", "Desc", "Same Question")));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));
        assertTrue(ex.getMessage().contains("Duplicate category"));
    }

    // --- Successful commit tests ---

    @Test
    void commit_successCreatesCategoriesQuestionsAndTemplate() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        when(itemRepository.findBySessionIdAndStatusOrderByRowNumber(1L, "VALID"))
                .thenReturn(validItems());

        // No existing categories
        when(categoryRepository.findAll()).thenReturn(new ArrayList<>());
        when(categoryRepository.count()).thenReturn(0L);
        when(categoryRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());

        // Capture saved category
        ArgumentCaptor<AppraisalCategory> catCaptor = ArgumentCaptor.forClass(AppraisalCategory.class);
        when(categoryRepository.save(catCaptor.capture())).thenAnswer(invocation -> {
            AppraisalCategory cat = invocation.getArgument(0);
            if (cat.getId() == null) cat.setId(10L);
            return cat;
        });

        // No existing questions
        when(questionRepository.findByCategoryIdAndQuestionTextIgnoreCase(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        when(questionRepository.findByCategoryIdOrderBySortOrderAsc(anyLong()))
                .thenReturn(new ArrayList<>());

        // Capture saved questions
        ArgumentCaptor<AppraisalQuestion> qCaptor = ArgumentCaptor.forClass(AppraisalQuestion.class);
        when(questionRepository.save(qCaptor.capture())).thenAnswer(invocation -> {
            AppraisalQuestion q = invocation.getArgument(0);
            if (q.getId() == null) q.setId(100L);
            return q;
        });

        // No active templates
        when(templateRepository.findAllByIsActiveTrue()).thenReturn(new ArrayList<>());

        // Department positions
        DepartmentPosition dp1 = new DepartmentPosition();
        dp1.setId(10L);
        DepartmentPosition dp2 = new DepartmentPosition();
        dp2.setId(20L);
        when(departmentPositionRepository.findAllById(List.of(10L, 20L)))
                .thenReturn(List.of(dp1, dp2));

        // Capture saved template
        ArgumentCaptor<AppraisalTemplate> tCaptor = ArgumentCaptor.forClass(AppraisalTemplate.class);
        when(templateRepository.save(tCaptor.capture())).thenAnswer(invocation -> {
            AppraisalTemplate t = invocation.getArgument(0);
            if (t.getId() == null) t.setId(99L);
            return t;
        });

        AppraisalImportCommitResponseDto result = service.commit(validRequest(), principal());

        assertTrue(result.getSuccess());
        assertEquals(1, result.getCreatedCategoryCount());
        assertEquals(0, result.getReusedCategoryCount());
        assertEquals(2, result.getCreatedQuestionCount());
        assertEquals(0, result.getReusedQuestionCount());
        assertEquals(0, result.getFailedCount());
        assertEquals(99L, result.getTemplateId());
        assertEquals("Q1 2026 Appraisal", result.getTemplateName());

        // Verify template was saved with correct metadata
        AppraisalTemplate savedTemplate = tCaptor.getValue();
        assertEquals("Q1 2026 Appraisal", savedTemplate.getName());
        assertEquals(LocalDate.of(2026, 1, 1), savedTemplate.getAssessmentDate());
        assertEquals(LocalDate.of(2026, 1, 15), savedTemplate.getEffectiveDate());
        assertEquals(LocalDate.of(2026, 2, 28), savedTemplate.getDeadlineDate());
        assertEquals(1L, savedTemplate.getReviewCycleId());
        assertEquals(5, savedTemplate.getMaxRating());
        assertTrue(savedTemplate.getIsActive());
        assertNotNull(savedTemplate.getCategories());
        assertEquals(1, savedTemplate.getCategories().size());
        assertNotNull(savedTemplate.getTargetDepartmentPositions());
        assertEquals(2, savedTemplate.getTargetDepartmentPositions().size());

        // Verify category was marked as finalized
        AppraisalCategory savedCat = catCaptor.getValue();
        assertTrue(savedCat.getIsFinalized());
        assertEquals("Communication", savedCat.getName());
    }

    @Test
    void commit_successReusesExistingCategory() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        when(itemRepository.findBySessionIdAndStatusOrderByRowNumber(1L, "VALID"))
                .thenReturn(validItems());

        // Existing category
        AppraisalCategory existing = new AppraisalCategory();
        existing.setId(10L);
        existing.setName("Communication");
        existing.setIsFinalized(false);
        when(categoryRepository.findAll()).thenReturn(List.of(existing));
        when(categoryRepository.findByNameIgnoreCase("Communication"))
                .thenReturn(Optional.of(existing));

        // No existing questions
        when(questionRepository.findByCategoryIdAndQuestionTextIgnoreCase(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        when(questionRepository.findByCategoryIdOrderBySortOrderAsc(anyLong()))
                .thenReturn(new ArrayList<>());

        ArgumentCaptor<AppraisalQuestion> qCaptor = ArgumentCaptor.forClass(AppraisalQuestion.class);
        when(questionRepository.save(qCaptor.capture())).thenAnswer(invocation -> {
            AppraisalQuestion q = invocation.getArgument(0);
            if (q.getId() == null) q.setId(100L);
            return q;
        });

        when(templateRepository.findAllByIsActiveTrue()).thenReturn(new ArrayList<>());

        DepartmentPosition dp1 = new DepartmentPosition();
        dp1.setId(10L);
        when(departmentPositionRepository.findAllById(anyList())).thenReturn(List.of(dp1));

        when(templateRepository.save(any())).thenAnswer(invocation -> {
            AppraisalTemplate t = invocation.getArgument(0);
            if (t.getId() == null) t.setId(99L);
            return t;
        });

        AppraisalImportCommitResponseDto result = service.commit(validRequest(), principal());

        assertTrue(result.getSuccess());
        assertEquals(0, result.getCreatedCategoryCount());
        assertEquals(1, result.getReusedCategoryCount());
        assertEquals(2, result.getCreatedQuestionCount());
    }

    @Test
    void commit_deactivatesPreviousActiveTemplates() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        when(itemRepository.findBySessionIdAndStatusOrderByRowNumber(1L, "VALID"))
                .thenReturn(validItems());

        when(categoryRepository.findAll()).thenReturn(new ArrayList<>());
        when(categoryRepository.count()).thenReturn(0L);
        when(categoryRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        ArgumentCaptor<AppraisalCategory> catCaptor = ArgumentCaptor.forClass(AppraisalCategory.class);
        when(categoryRepository.save(catCaptor.capture())).thenAnswer(invocation -> {
            AppraisalCategory cat = invocation.getArgument(0);
            if (cat.getId() == null) cat.setId(10L);
            return cat;
        });

        when(questionRepository.findByCategoryIdAndQuestionTextIgnoreCase(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        when(questionRepository.findByCategoryIdOrderBySortOrderAsc(anyLong()))
                .thenReturn(new ArrayList<>());
        when(questionRepository.save(any())).thenAnswer(invocation -> {
            AppraisalQuestion q = invocation.getArgument(0);
            if (q.getId() == null) q.setId(100L);
            return q;
        });

        // Previous active templates
        AppraisalTemplate oldActive1 = new AppraisalTemplate();
        oldActive1.setId(1L);
        oldActive1.setIsActive(true);
        AppraisalTemplate oldActive2 = new AppraisalTemplate();
        oldActive2.setId(2L);
        oldActive2.setIsActive(true);
        when(templateRepository.findAllByIsActiveTrue()).thenReturn(List.of(oldActive1, oldActive2));

        when(departmentPositionRepository.findAllById(anyList())).thenReturn(new ArrayList<>());

        ArgumentCaptor<AppraisalTemplate> tCaptor = ArgumentCaptor.forClass(AppraisalTemplate.class);
        when(templateRepository.save(tCaptor.capture())).thenAnswer(invocation -> {
            AppraisalTemplate t = invocation.getArgument(0);
            if (t.getId() == null) t.setId(99L);
            return t;
        });

        service.commit(validRequest(), principal());

        // Verify old templates were deactivated
        assertEquals(3, tCaptor.getAllValues().size()); // 2 deactivations + 1 creation
        assertTrue(oldActive1.getIsActive() == false);
        assertTrue(oldActive2.getIsActive() == false);
    }

    @Test
    void commit_reusesExistingQuestion() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));
        when(itemRepository.findBySessionIdAndStatusOrderByRowNumber(1L, "VALID"))
                .thenReturn(validItems());

        when(categoryRepository.findAll()).thenReturn(new ArrayList<>());
        when(categoryRepository.count()).thenReturn(0L);
        when(categoryRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(categoryRepository.save(any())).thenAnswer(invocation -> {
            AppraisalCategory cat = invocation.getArgument(0);
            if (cat.getId() == null) cat.setId(10L);
            return cat;
        });

        // Existing question
        AppraisalQuestion existingQ = new AppraisalQuestion();
        existingQ.setId(100L);
        existingQ.setQuestionText("Active Listening");
        when(questionRepository.findByCategoryIdAndQuestionTextIgnoreCase(10L, "Active Listening"))
                .thenReturn(Optional.of(existingQ));
        when(questionRepository.findByCategoryIdAndQuestionTextIgnoreCase(10L, "Clear Writing"))
                .thenReturn(Optional.empty());
        when(questionRepository.findByCategoryIdOrderBySortOrderAsc(10L))
                .thenReturn(List.of(existingQ));
        when(questionRepository.save(any())).thenAnswer(invocation -> {
            AppraisalQuestion q = invocation.getArgument(0);
            if (q.getId() == null) q.setId(101L);
            return q;
        });

        when(templateRepository.findAllByIsActiveTrue()).thenReturn(new ArrayList<>());
        when(departmentPositionRepository.findAllById(anyList())).thenReturn(new ArrayList<>());
        when(templateRepository.save(any())).thenAnswer(invocation -> {
            AppraisalTemplate t = invocation.getArgument(0);
            if (t.getId() == null) t.setId(99L);
            return t;
        });

        AppraisalImportCommitResponseDto result = service.commit(validRequest(), principal());

        assertEquals(1, result.getReusedQuestionCount());
        assertEquals(1, result.getCreatedQuestionCount());
    }

    // --- Atomicity test ---

    @Test
    void commit_failsAtomicallyWhenValidationFails() {
        when(sessionRepository.findByValidationId("test-validation-uuid"))
                .thenReturn(Optional.of(validSession(false)));

        AppraisalImportCommitRequestDto req = validRequest();
        req.setEditedRows(List.of(
                editedRow(2, "", "Desc", "Question"), // blank category name
                editedRow(3, "Communication", "Desc", "Another Question")));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.commit(req, principal()));

        // Verify no DB writes occurred
        verify(categoryRepository, never()).save(any(AppraisalCategory.class));
        verify(questionRepository, never()).save(any(AppraisalQuestion.class));
        verify(templateRepository, never()).save(any(AppraisalTemplate.class));
        verify(sessionRepository, never()).save(any(AppraisalImportSession.class));
    }
}
