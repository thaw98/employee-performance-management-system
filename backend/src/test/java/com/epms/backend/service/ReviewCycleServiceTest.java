package com.epms.backend.service;

import com.epms.backend.dto.ReviewCycleDto;
import com.epms.backend.entity.ReviewCycle;
import com.epms.backend.repository.ReviewCycleRepository;
import com.epms.backend.repository.TimeSettingRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReviewCycleServiceTest {

    private final ReviewCycleRepository reviewCycleRepository = mock(ReviewCycleRepository.class);
    private final TimeSettingRepository timeSettingRepository = mock(TimeSettingRepository.class);
    private final ReviewCycleService service = new ReviewCycleService(reviewCycleRepository, timeSettingRepository);

    @Test
    void getCyclesDerivesUpcomingActiveAndClosedStatuses() {
        LocalDate today = LocalDate.now();
        ReviewCycle upcoming = cycle("Upcoming", today.plusDays(1), today.plusDays(30), 1);
        ReviewCycle active = cycle("Active", today.minusDays(1), today.plusDays(1), 2);
        ReviewCycle closed = cycle("Closed", today.minusDays(30), today.minusDays(1), 3);
        when(reviewCycleRepository.findAll()).thenReturn(List.of(upcoming, active, closed));

        List<ReviewCycleDto> cycles = service.getCycles(null, null, null);

        assertThat(cycles).extracting(ReviewCycleDto::status)
                .containsExactly("CLOSED", "ACTIVE", "UPCOMING");
        assertThat(cycles).extracting(ReviewCycleDto::isActive)
                .containsExactly(false, true, false);
    }

    @Test
    void getCyclesFiltersClosedStatus() {
        LocalDate today = LocalDate.now();
        ReviewCycle upcoming = cycle("Upcoming", today.plusDays(1), today.plusDays(30), 1);
        ReviewCycle active = cycle("Active", today.minusDays(1), today.plusDays(1), 2);
        ReviewCycle closed = cycle("Closed", today.minusDays(30), today.minusDays(1), 3);
        when(reviewCycleRepository.findAll()).thenReturn(List.of(upcoming, active, closed));

        List<ReviewCycleDto> cycles = service.getCycles("CLOSED", null, null);

        assertThat(cycles).hasSize(1);
        assertThat(cycles.get(0).name()).isEqualTo("Closed");
        assertThat(cycles.get(0).status()).isEqualTo("CLOSED");
        assertThat(cycles.get(0).isActive()).isFalse();
    }

    @Test
    void getCyclesFiltersActiveAndUpcomingStatuses() {
        LocalDate today = LocalDate.now();
        ReviewCycle upcoming = cycle("Upcoming", today.plusDays(1), today.plusDays(30), 1);
        ReviewCycle active = cycle("Active", today.minusDays(1), today.plusDays(1), 2);
        ReviewCycle closed = cycle("Closed", today.minusDays(30), today.minusDays(1), 3);
        when(reviewCycleRepository.findAll()).thenReturn(List.of(upcoming, active, closed));

        assertThat(service.getCycles("ACTIVE", null, null))
                .singleElement()
                .extracting(ReviewCycleDto::status)
                .isEqualTo("ACTIVE");
        assertThat(service.getCycles("UPCOMING", null, null))
                .singleElement()
                .extracting(ReviewCycleDto::status)
                .isEqualTo("UPCOMING");
    }

    private ReviewCycle cycle(String name, LocalDate start, LocalDate end, int sequenceNo) {
        ReviewCycle cycle = new ReviewCycle();
        cycle.setName(name);
        cycle.setCode("CYCLE-" + sequenceNo);
        cycle.setCycleType(ReviewCycle.CycleType.QUARTERLY);
        cycle.setYearLabel(String.valueOf(start.getYear()));
        cycle.setSequenceNo(sequenceNo);
        cycle.setStartDate(start);
        cycle.setEndDate(end);
        cycle.setRequiresEmployeeSubmission(true);
        return cycle;
    }
}
