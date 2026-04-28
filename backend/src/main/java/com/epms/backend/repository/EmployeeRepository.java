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

	/**
	 * Checks if an employee with the given normalized staff NRC number exists.
	 * This checks for exact matches of the normalized NRC value.
	 *
	 * @param normalizedStaffNrcNo the normalized NRC number to check
	 * @return true if an employee with the normalized NRC exists, false otherwise
	 */
	boolean existsByStaffNrcNo(String normalizedStaffNrcNo);

	/**
	 * Checks if an employee with the given normalized staff NRC number exists, excluding a specific employee ID.
	 * Used during updates to prevent false positives when an employee is not changing their NRC.
	 *
	 * @param normalizedStaffNrcNo the normalized NRC number to check
	 * @param excludeId the employee ID to exclude from the check
	 * @return true if another employee with the normalized NRC exists, false otherwise
	 */
	boolean existsByStaffNrcNoAndIdNot(String normalizedStaffNrcNo, Long excludeId);

	java.util.List<Employee> findByDepartmentId(Long departmentId);

	boolean existsByDepartment_IdAndPosition_Id(Long departmentId, Long positionId);

	@Query("""
			select e
			from Employee e
			left join fetch e.department
			left join fetch e.position
			left join fetch e.staffType
			left join fetch e.probation
			left join fetch e.emergencyContact
			left join fetch e.father
			order by e.id asc
			""")
	List<Employee> findAllForExport();

	@Query("""
			select e
			from Employee e
			join fetch e.position p
			join fetch p.role r
			where r.id = 2
			order by e.employeeName asc
			""")
	List<Employee> findDepartmentHeadOptions();
}
