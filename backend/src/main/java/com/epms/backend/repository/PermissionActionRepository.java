package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.PermissionAction;

public interface PermissionActionRepository extends JpaRepository<PermissionAction, Long> {

    List<PermissionAction> findByModuleKeyOrderBySortOrderAsc(String moduleKey);

    Optional<PermissionAction> findByModuleKeyAndActionKey(String moduleKey, String actionKey);

    boolean existsByModuleKeyAndActionKey(String moduleKey, String actionKey);

    List<PermissionAction> findAllByOrderBySortOrderAsc();
}
