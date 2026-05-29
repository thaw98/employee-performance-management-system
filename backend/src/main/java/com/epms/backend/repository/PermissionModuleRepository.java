package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.PermissionModule;

public interface PermissionModuleRepository extends JpaRepository<PermissionModule, Long> {

    Optional<PermissionModule> findByModuleKey(String moduleKey);

    boolean existsByModuleKey(String moduleKey);

    List<PermissionModule> findAllByOrderBySortOrderAsc();
}
