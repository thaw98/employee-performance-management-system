package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.DepartmentManagerHistory;

public interface DepartmentManagerHistoryRepository extends JpaRepository<DepartmentManagerHistory, Long> {
}
