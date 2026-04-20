package com.epms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.LevelCode;

public interface LevelCodeRepository extends JpaRepository<LevelCode, Long> {

	Optional<LevelCode> findByCode(String code);
}
