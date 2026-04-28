package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
	List<Department> findTop20ByNameContainingIgnoreCaseOrderByNameAsc(String keyword);

	List<Department> findByStatusNotIgnoreCase(String status);

	boolean existsByCodeIgnoreCaseAndStatusNotIgnoreCase(String code, String status);

	boolean existsByNameIgnoreCaseAndStatusNotIgnoreCase(String name, String status);

	boolean existsByCodeIgnoreCase(String code);

	boolean existsByNameIgnoreCase(String name);

	boolean existsByCodeIgnoreCaseAndIdNotAndStatusNotIgnoreCase(String code, Long id, String status);

	boolean existsByNameIgnoreCaseAndIdNotAndStatusNotIgnoreCase(String name, Long id, String status);

	boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

	boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

	Optional<Department> findByCodeIgnoreCase(String code);
}
