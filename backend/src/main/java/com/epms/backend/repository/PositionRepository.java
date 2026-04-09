package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Position;

public interface PositionRepository extends JpaRepository<Position, Long> {
	List<Position> findTop20ByNameContainingIgnoreCaseOrderByNameAsc(String keyword);
	List<Position> findByDepartmentIdOrderByNameAsc(Long departmentId);
}
