package com.epms.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.epms.backend.entity.EmployeeContextSnapshot;
import com.epms.backend.entity.SnapshotModuleType;

public interface EmployeeContextSnapshotRepository extends JpaRepository<EmployeeContextSnapshot, Long> {

    Optional<EmployeeContextSnapshot> findByModuleTypeAndReferenceId(SnapshotModuleType moduleType, Long referenceId);

    boolean existsByModuleTypeAndReferenceId(SnapshotModuleType moduleType, Long referenceId);
}
