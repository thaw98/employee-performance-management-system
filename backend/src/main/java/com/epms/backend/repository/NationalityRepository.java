package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Nationality;

public interface NationalityRepository extends JpaRepository<Nationality, Long> {
	List<Nationality> findAllByOrderByNameAsc();

	List<Nationality> findByNameContainingIgnoreCaseOrderByNameAsc(String keyword);

	Optional<Nationality> findByNameIgnoreCase(String name);
}
