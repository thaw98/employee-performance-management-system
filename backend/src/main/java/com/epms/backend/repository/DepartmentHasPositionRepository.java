package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.DepartmentHasPosition;

public interface DepartmentHasPositionRepository extends JpaRepository<DepartmentHasPosition, Long>,
		JpaSpecificationExecutor<DepartmentHasPosition> {

	boolean existsByDepartmentIdAndPositionIdAndStatusIgnoreCase(Long departmentId, Long positionId, String status);

	Optional<DepartmentHasPosition> findByDepartmentIdAndPositionId(Long departmentId, Long positionId);

	@Query("SELECT dhpo FROM DepartmentHasPosition dhpo " +
			"JOIN FETCH dhpo.department " +
			"JOIN FETCH dhpo.position p " +
			"JOIN FETCH p.levelCode " +
			"JOIN FETCH p.role " +
			"WHERE dhpo.department.id = :departmentId " +
			"AND LOWER(dhpo.status) = 'active' " +
			"AND LOWER(COALESCE(dhpo.department.status, 'ACTIVE')) = 'active' " +
			"AND LOWER(COALESCE(p.status, 'ACTIVE')) = 'active'")
	List<DepartmentHasPosition> findActiveByDepartmentIdWithPosition(@Param("departmentId") Long departmentId);

	@Query("SELECT dhpo FROM DepartmentHasPosition dhpo " +
			"JOIN FETCH dhpo.department " +
			"JOIN FETCH dhpo.position p " +
			"JOIN FETCH p.levelCode " +
			"JOIN FETCH p.role " +
			"WHERE LOWER(dhpo.status) = 'active' " +
			"AND LOWER(COALESCE(dhpo.department.status, 'ACTIVE')) = 'active' " +
			"AND LOWER(COALESCE(p.status, 'ACTIVE')) = 'active'")
	List<DepartmentHasPosition> findAllActiveWithPosition();

	List<DepartmentHasPosition> findByDepartmentId(Long departmentId);

	List<DepartmentHasPosition> findByPositionId(Long positionId);
}