package com.epms.backend.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

	Optional<User> findFirstByEmployee_EmailIgnoreCaseOrderByActiveDescIdAsc(String email);

	Optional<User> findByEmployee_Id(Long employeeId);

	boolean existsByEmployee_EmailIgnoreCase(String email);

	boolean existsByEmployee_Id(Long employeePkId);

	List<User> findByRole_NameIgnoreCase(String roleName);

	@Query("""
			select u
			from User u
			left join fetch u.employee e
			left join fetch e.department
			where u.id = :id
			""")
	Optional<User> findByIdWithEmployeeDepartment(@Param("id") Long id);

	java.util.List<User> findByRole_IdAndActiveTrue(Long roleId);
}
