package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.DepartmentManagerHistory;

public interface DepartmentManagerHistoryRepository extends JpaRepository<DepartmentManagerHistory, Long> {

    List<DepartmentManagerHistory> findByDepartment_IdAndEndDateIsNull(Long departmentId);
}
