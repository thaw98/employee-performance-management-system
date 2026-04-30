package com.epms.backend.repository;

import com.epms.backend.entity.ReviewCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewCycleRepository extends JpaRepository<ReviewCycle, Long> {
    Optional<ReviewCycle> findByYearLabelAndCycleTypeAndSequenceNo(
            String yearLabel,
            ReviewCycle.CycleType cycleType,
            Integer sequenceNo
    );

    List<ReviewCycle> findByYearLabelOrderByStartDateAscSequenceNoAsc(String yearLabel);

    List<ReviewCycle> findByStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByRequiresEmployeeSubmissionDescStartDateDesc(
            LocalDate startDate,
            LocalDate endDate
    );

    List<ReviewCycle> findByRequiresEmployeeSubmissionTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByStartDateDesc(
            LocalDate startDate,
            LocalDate endDate
    );
}
