package com.epms.backend.repository;

import com.epms.backend.entity.Period;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PeriodRepository extends JpaRepository<Period, Long> {
    List<Period> findByTimeSettingIdOrderByStartDateAscPeriodTypeAsc(Long timeSettingId);

    void deleteByTimeSettingId(Long timeSettingId);
}
