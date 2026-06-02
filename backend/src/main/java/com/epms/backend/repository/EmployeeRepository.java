package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.EmployeeStatus;

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

	List<Employee> findTop10ByEmployeeNameStartingWithIgnoreCaseOrderByIdDesc(String employeeName);

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

	@Query("""
			select e
			from Employee e
			join fetch e.userAccount u
			left join fetch e.department
			left join fetch e.position
			left join fetch e.position.levelCode
			where e.employmentStatus = com.epms.backend.entity.EmployeeStatus.ACTIVE
			  and u.active = true
			order by e.employeeName asc
			""")
	java.util.List<Employee> findAllActiveWithUserAccount();

	java.util.List<Employee> findByDepartmentId(Long departmentId);
	
	java.util.List<Employee> findByManagerId(Long managerId);

	java.util.List<Employee> findByDepartment_IdAndPosition_Id(Long departmentId, Long positionId);

	java.util.List<Employee> findByDepartmentPosition_Id(Long departmentPositionId);

	long countByEmploymentStatus(EmployeeStatus employmentStatus);

	@Query("""
			SELECT COALESCE(d.name, 'Unassigned'), COUNT(e)
			FROM Employee e
			LEFT JOIN e.department d
			WHERE e.employmentStatus = com.epms.backend.entity.EmployeeStatus.ACTIVE
			GROUP BY d.name
			ORDER BY COUNT(e) DESC, d.name ASC
			""")
	List<Object[]> countActiveEmployeesByDepartment();

	@Query("""
			select e
			from Employee e
			join e.userAccount u
			left join fetch e.department
			left join fetch e.position
			left join fetch e.staffType
			where e.department.id = :departmentId
			  and e.position.id = :positionId
			  and e.employmentStatus = :employmentStatus
			  and e.staffType.id = :staffTypeId
			  and u.active = true
			order by e.employeeName asc
			""")
	java.util.List<Employee> findEligibleSelfAssessmentAssignees(
			@Param("departmentId") Long departmentId,
			@Param("positionId") Long positionId,
			@Param("employmentStatus") EmployeeStatus employmentStatus,
			@Param("staffTypeId") Long staffTypeId);

	@Query("""
			select e
			from Employee e
			join e.userAccount u
			left join fetch e.department
			left join fetch e.position
			left join fetch e.staffType
			where e.employmentStatus = :employmentStatus
			  and (e.staffType is null or e.staffType.id <> :excludedStaffTypeId)
			  and u.active = true
			order by e.employeeName asc
			""")
	java.util.List<Employee> findEligibleSelfAssessmentAssignees(
			@Param("employmentStatus") EmployeeStatus employmentStatus,
			@Param("excludedStaffTypeId") Long excludedStaffTypeId);

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
			left join fetch e.spouse
			order by e.id asc
			""")
	List<Employee> findAllForExport();

	@Query("""
			SELECT e.department.id, e.position.id, COUNT(e)
			FROM Employee e
			WHERE e.department IS NOT NULL
			  AND e.position IS NOT NULL
			  AND e.employmentStatus = com.epms.backend.entity.EmployeeStatus.ACTIVE
			GROUP BY e.department.id, e.position.id
			""")
	List<Object[]> countActiveEmployeesPerDepartmentAndPosition();

	@Query("SELECT e.id, e.department.id, e.position.id FROM Employee e WHERE e.id IN :ids")
	List<Object[]> findBasicInfoByIds(@Param("ids") java.util.Set<Long> ids);
}
