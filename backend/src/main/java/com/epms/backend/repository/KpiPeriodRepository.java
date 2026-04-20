package com.epms.backend.repository;

//MNA
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.epms.backend.entity.KpiPeriod;

@Repository
public interface KpiPeriodRepository extends JpaRepository<KpiPeriod, Long> {
}
