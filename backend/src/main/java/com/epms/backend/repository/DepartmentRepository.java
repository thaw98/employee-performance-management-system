package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

	@Query("""
			select e.employeeName
			from Employee e
			join e.position p
			join p.role r
			where e.id = :managerId
			  and r.id = :roleId
			""")
	Optional<String> findManagerNameByIdAndRoleId(@Param("managerId") Long managerId, @Param("roleId") Long roleId);
}
