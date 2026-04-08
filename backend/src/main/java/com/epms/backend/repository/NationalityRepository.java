package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.Nationality;

public interface NationalityRepository extends JpaRepository<Nationality, Long> {
	List<Nationality> findAllByOrderByNameAsc();
}
