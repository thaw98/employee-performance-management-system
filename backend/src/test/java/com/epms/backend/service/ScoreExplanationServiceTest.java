package com.epms.backend.service;

import com.epms.backend.audit.AuditActionType;
import com.epms.backend.audit.AuditTargetType;
import com.epms.backend.dto.score.ScoreExplanationDto;
import com.epms.backend.dto.score.UpdateScoreExplanationRequest;
import com.epms.backend.entity.ScoreExplanation;
import com.epms.backend.entity.ScoreExplanationModule;
import com.epms.backend.repository.ScoreExplanationRepository;
import com.epms.backend.security.UserPrincipal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScoreExplanationServiceTest {
    private final ScoreExplanationRepository repository = mock(ScoreExplanationRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final ScoreExplanationService service = new ScoreExplanationService(repository, auditService);

    @Test
    void updateAppliesSameSortOrderToSelectedModulesAndAuditsEachChange() {
        List<ScoreExplanation> selfRows = rows(ScoreExplanationModule.SELF_ASSESSMENT);
        List<ScoreExplanation> feedbackRows = rows(ScoreExplanationModule.FEEDBACK_360);
        ScoreExplanation source = selfRows.get(1);
        ScoreExplanation feedbackMatch = feedbackRows.get(1);

        when(repository.findById(source.getId())).thenReturn(Optional.of(source));
        when(repository.findByModuleAndSortOrder(ScoreExplanationModule.SELF_ASSESSMENT, 2)).thenReturn(Optional.of(source));
        when(repository.findByModuleAndSortOrder(ScoreExplanationModule.FEEDBACK_360, 2)).thenReturn(Optional.of(feedbackMatch));
        when(repository.findByModuleOrderBySortOrderAsc(ScoreExplanationModule.SELF_ASSESSMENT)).thenReturn(selfRows);
        when(repository.findByModuleOrderBySortOrderAsc(ScoreExplanationModule.FEEDBACK_360)).thenReturn(feedbackRows);
        when(repository.save(any(ScoreExplanation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserPrincipal actor = mock(UserPrincipal.class);
        when(actor.getId()).thenReturn(10L);
        when(actor.getRoleId()).thenReturn(1L);

        List<ScoreExplanationDto> result = service.update(source.getId(), new UpdateScoreExplanationRequest(
                71,
                85,
                "Strong",
                "Reliable strong performance",
                "Align wording",
                List.of("SELF_ASSESSMENT", "FEEDBACK_360")), actor);

        assertThat(result).hasSize(2);
        assertThat(source.getTitle()).isEqualTo("Strong");
        assertThat(feedbackMatch.getTitle()).isEqualTo("Strong");
        verify(auditService, times(2)).record(
                eq(AuditActionType.SCORE_EXPLANATION_UPDATED),
                eq(AuditTargetType.SCORE_EXPLANATION),
                any(),
                eq(10L),
                eq(1L),
                any(),
                any(),
                any(),
                any());
    }

    @Test
    void updateRejectsRangesThatBreakCoverage() {
        List<ScoreExplanation> rows = rows(ScoreExplanationModule.APPRAISAL);
        ScoreExplanation source = rows.get(1);
        when(repository.findById(source.getId())).thenReturn(Optional.of(source));
        when(repository.findByModuleAndSortOrder(ScoreExplanationModule.APPRAISAL, 2)).thenReturn(Optional.of(source));
        when(repository.findByModuleOrderBySortOrderAsc(ScoreExplanationModule.APPRAISAL)).thenReturn(rows);

        UserPrincipal actor = mock(UserPrincipal.class);
        when(actor.getId()).thenReturn(10L);
        when(actor.getRoleId()).thenReturn(1L);

        assertThatThrownBy(() -> service.update(source.getId(), new UpdateScoreExplanationRequest(
                72,
                85,
                "Good",
                "Good performance",
                "Testing gap validation",
                List.of("APPRAISAL")), actor))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no gaps or overlaps");
    }

    private static List<ScoreExplanation> rows(ScoreExplanationModule module) {
        List<ScoreExplanation> rows = new ArrayList<>();
        rows.add(row(1L + module.ordinal() * 10L, module, 1, 86, 100, "Outstanding"));
        rows.add(row(2L + module.ordinal() * 10L, module, 2, 71, 85, "Good"));
        rows.add(row(3L + module.ordinal() * 10L, module, 3, 60, 70, "Meet Requirement"));
        rows.add(row(4L + module.ordinal() * 10L, module, 4, 40, 59, "Need Improvement"));
        rows.add(row(5L + module.ordinal() * 10L, module, 5, 0, 39, "Unsatisfactory"));
        return rows;
    }

    private static ScoreExplanation row(Long id, ScoreExplanationModule module, int sortOrder, int min, int max, String title) {
        ScoreExplanation row = new ScoreExplanation();
        row.setId(id);
        row.setModule(module);
        row.setSortOrder(sortOrder);
        row.setMinScore(min);
        row.setMaxScore(max);
        row.setTitle(title);
        row.setDetails(title + " details");
        return row;
    }
}
