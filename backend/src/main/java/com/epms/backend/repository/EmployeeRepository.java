package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
	boolean existsByEmployeeId(String employeeId);

	boolean existsByEmployeeIdAndIdNot(String employeeId, Long id);

	boolean existsByEmailAddressIgnoreCase(String email);

	boolean existsByEmailAddressIgnoreCaseAndIdNot(String email, Long id);

	Optional<Employee> findByEmployeeId(String employeeId);

	List<Employee> findTop10ByEmployeeIdContainingIgnoreCaseOrEmployeeNameContainingIgnoreCase(String employeeId, String employeeName);
}
