package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.DepartmentPosition;

public interface DepartmentPositionRepository extends JpaRepository<DepartmentPosition, Long>,
		JpaSpecificationExecutor<DepartmentPosition> {

	boolean existsByDepartmentIdAndPositionIdAndStatusIgnoreCase(Long departmentId, Long positionId, String status);

	Optional<DepartmentPosition> findByDepartmentIdAndPositionId(Long departmentId, Long positionId);

	@Query("SELECT dp FROM DepartmentPosition dp " +
			"JOIN FETCH dp.department " +
			"JOIN FETCH dp.position " +
			"WHERE dp.department.id = :departmentId " +
			"ORDER BY dp.id ASC")
	List<DepartmentPosition> findAllByDepartment_IdOrderByIdAsc(@Param("departmentId") Long departmentId);

	boolean existsByDepartment_IdAndPosition_Id(Long departmentId, Long positionId);

	@Query("SELECT dp FROM DepartmentPosition dp " +
			"JOIN FETCH dp.department " +
			"JOIN FETCH dp.position p " +
			"JOIN FETCH p.levelCode " +
			"JOIN FETCH p.role " +
			"WHERE dp.department.id = :departmentId " +
			"AND LOWER(dp.status) = 'active' " +
			"AND LOWER(COALESCE(dp.department.status, 'ACTIVE')) = 'active' " +
			"AND LOWER(COALESCE(p.status, 'ACTIVE')) = 'active'")
	List<DepartmentPosition> findActiveByDepartmentIdWithPosition(@Param("departmentId") Long departmentId);

	@Query("SELECT dp FROM DepartmentPosition dp " +
			"JOIN FETCH dp.department " +
			"JOIN FETCH dp.position p " +
			"JOIN FETCH p.levelCode " +
			"JOIN FETCH p.role " +
			"WHERE LOWER(dp.status) = 'active' " +
			"AND LOWER(COALESCE(dp.department.status, 'ACTIVE')) = 'active' " +
			"AND LOWER(COALESCE(p.status, 'ACTIVE')) = 'active'")
	List<DepartmentPosition> findAllActiveWithPosition();

	List<DepartmentPosition> findByDepartmentId(Long departmentId);

	List<DepartmentPosition> findByPositionId(Long positionId);
}
