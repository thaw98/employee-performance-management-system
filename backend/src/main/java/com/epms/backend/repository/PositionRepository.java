package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.Position;

public interface PositionRepository extends JpaRepository<Position, Long> {
	List<Position> findTop20ByNameContainingIgnoreCaseOrderByNameAsc(String keyword);

	List<Position> findTop20ByDepartmentIdAndNameContainingIgnoreCaseOrderByNameAsc(Long departmentId, String name);

	List<Position> findByDepartmentIdOrderByNameAsc(Long departmentId);

	@Query("SELECT DISTINCT p FROM Position p LEFT JOIN FETCH p.role LEFT JOIN FETCH p.department WHERE p.id = :id")
	Optional<Position> findByIdWithRoleAndDepartment(@Param("id") Long id);

	/**
	 * Positions scoped to a department, plus positions not yet linked to any department (shared / legacy rows).
	 */
	@Query("SELECT p FROM Position p WHERE (p.department IS NULL OR p.department.id = :departmentId) "
			+ "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY p.name ASC")
	List<Position> findForAutocompleteByDepartmentOrUnassigned(@Param("departmentId") Long departmentId,
			@Param("keyword") String keyword, Pageable pageable);
}
