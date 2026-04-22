package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
	List<Department> findTop20ByNameContainingIgnoreCaseOrderByNameAsc(String keyword);

	List<Department> findByStatusNotOrderByNameAsc(String status);

	boolean existsByCodeIgnoreCaseAndStatusNot(String code, String status);

	boolean existsByNameIgnoreCaseAndStatusNot(String name, String status);

	boolean existsByCodeIgnoreCaseAndIdNotAndStatusNot(String code, Long id, String status);

	boolean existsByNameIgnoreCaseAndIdNotAndStatusNot(String name, Long id, String status);
}
