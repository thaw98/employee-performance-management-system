package com.epms.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.EmployeePermission;

public interface EmployeePermissionRepository extends JpaRepository<EmployeePermission, Long> {

    List<EmployeePermission> findByEmployeeId(Long employeeId);

    Optional<EmployeePermission> findByEmployeeIdAndModuleKeyAndActionKey(Long employeeId, String moduleKey, String actionKey);

    void deleteByEmployeeIdAndModuleKeyAndActionKey(Long employeeId, String moduleKey, String actionKey);

    List<EmployeePermission> findByEmployeeIdIn(List<Long> employeeIds);

    boolean existsByEmployeeIdAndModuleKeyAndActionKey(Long employeeId, String moduleKey, String actionKey);
}
