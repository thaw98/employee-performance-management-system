package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.epms.backend.entity.LevelCode;

@Repository
public interface LevelCodeRepository extends JpaRepository<LevelCode, Long> {

	Optional<LevelCode> findByCode(String code);

	boolean existsByCode(String code);

	boolean existsByCodeIgnoreCase(String code);

	@Query("SELECT lc FROM LevelCode lc ORDER BY lc.code ASC")
	List<LevelCode> findAllOrderByCode();
}
