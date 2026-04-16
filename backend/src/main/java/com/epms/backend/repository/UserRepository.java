package com.epms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findByEmployee_EmailIgnoreCase(String email);

	Optional<User> findByEmployee_Id(Long employeeId);

	boolean existsByEmployee_EmailIgnoreCase(String email);

	boolean existsByEmployee_Id(Long employeePkId);
}
