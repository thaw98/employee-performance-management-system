package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
	List<Department> findTop20ByNameContainingIgnoreCaseOrderByNameAsc(String keyword);
}
