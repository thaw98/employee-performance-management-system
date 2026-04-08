package com.epms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmailIgnoreCase(String email);

	Optional<User> findByEmployee_EmployeeId(String employeeId);

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByEmployee_Id(Long employeePkId);
}
