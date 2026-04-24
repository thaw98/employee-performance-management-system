package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.Position;

public interface PositionRepository extends JpaRepository<Position, Long>, JpaSpecificationExecutor<Position> {

	Optional<Position> findByCodeIgnoreCase(String code);

	Optional<Position> findByNameIgnoreCase(String name);

	boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

	boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

	@Query("SELECT DISTINCT p FROM Position p LEFT JOIN FETCH p.levelCode LEFT JOIN FETCH p.role WHERE p.id = :id")
	Optional<Position> findByIdWithLevelCodeAndRole(@Param("id") Long id);

	List<Position> findByStatusIgnoreCase(String status);

	@Query("SELECT p FROM Position p WHERE LOWER(COALESCE(p.status, 'ACTIVE')) = 'active' AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.name ASC")
	List<Position> findActiveByNameContaining(@Param("keyword") String keyword, Pageable pageable);

	// Backward compatibility methods - using department_position mapping instead
	List<Position> findTop20ByNameContainingIgnoreCaseOrderByNameAsc(String keyword);

	@Query("SELECT p FROM Position p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.name ASC")
	List<Position> findForAutocompleteByKeyword(@Param("keyword") String keyword, Pageable pageable);

	@Query("SELECT p FROM Position p JOIN p.departmentPositions dp WHERE dp.department.id = :departmentId ORDER BY p.name ASC")
	List<Position> findByDepartmentIdOrderByNameAsc(@Param("departmentId") Long departmentId);

	@Query("SELECT p FROM Position p WHERE p.id IN (SELECT dp.position.id FROM DepartmentPosition dp WHERE dp.department.id = :departmentId) AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.name ASC")
	List<Position> findForAutocompleteByDepartmentOrUnassigned(@Param("departmentId") Long departmentId, @Param("keyword") String keyword, Pageable pageable);

}
