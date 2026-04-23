package com.epms.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.StaffType;

public interface StaffTypeRepository extends JpaRepository<StaffType, Long> {
}
