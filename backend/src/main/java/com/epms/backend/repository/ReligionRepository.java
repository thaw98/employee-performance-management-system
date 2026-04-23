package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Religion;

public interface ReligionRepository extends JpaRepository<Religion, Long> {
	List<Religion> findAllByOrderByNameAsc();
}
