package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.Department;

import jakarta.persistence.LockModeType;

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

	Optional<Department> findFirstByManagerId(Long managerId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT d FROM Department d WHERE d.id = :id")
	Optional<Department> findWithLockById(@Param("id") Long id);
}
