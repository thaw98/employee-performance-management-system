package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.epms.backend.entity.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, JpaSpecificationExecutor<Employee> {

	/**
	 * Highest numeric {@code staff_no} (MySQL: only rows where staff_no is all digits).
	 */
	@Query(value = """
			SELECT MAX(CAST(staff_no AS UNSIGNED))
			FROM employee
			WHERE staff_no IS NOT NULL
			  AND TRIM(staff_no) <> ''
			  AND staff_no REGEXP '^[0-9]+$'
			""", nativeQuery = true)
	Optional<Long> findMaxNumericStaffNo();

	List<Employee> findTop10ByEmployeeNameContainingIgnoreCaseOrderByIdDesc(String employeeName);

	Optional<Employee> findByEmployeeId(String employeeId);

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByEmployeeId(String employeeId);

	boolean existsByEmployeeIdAndIdNot(String employeeId, Long excludeId);

	boolean existsByEmailIgnoreCaseAndIdNot(String email, Long excludeId);

	java.util.List<Employee> findByDepartmentId(Long departmentId);
}
