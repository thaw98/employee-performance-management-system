package com.epms.backend.repository;



import java.util.List;
import java.util.Optional;



import org.springframework.data.jpa.repository.JpaRepository;



import com.epms.backend.entity.Employee;



public interface EmployeeRepository extends JpaRepository<Employee, Long> {

	List<Employee> findTop10ByEmployeeNameContainingIgnoreCaseOrderByIdDesc(String employeeName);

	Optional<Employee> findByEmployeeId(String employeeId);

}

