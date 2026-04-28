package com.epms.backend.repository;

import com.epms.backend.entity.TimeSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TimeSettingRepository extends JpaRepository<TimeSetting, Long> {
    Optional<TimeSetting> findFirstByOrderByIdAsc();
}
