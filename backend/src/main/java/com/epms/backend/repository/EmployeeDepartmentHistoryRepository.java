package com.epms.backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.EmployeeDepartmentHistory;
import com.epms.backend.entity.TransferType;

public interface EmployeeDepartmentHistoryRepository extends JpaRepository<EmployeeDepartmentHistory, Long> {

    Optional<EmployeeDepartmentHistory> findByEmployee_IdAndCurrentTrue(Long employeeId);

    boolean existsByEmployee_IdAndCurrentTrue(Long employeeId);

    List<EmployeeDepartmentHistory> findByEmployee_IdOrderByEffectiveStartDateDesc(Long employeeId);

    @Query("""
        SELECT h FROM EmployeeDepartmentHistory h
        WHERE h.employee.id = :employeeId
          AND h.transferType IN :baseTypes
          AND h.current = false
        ORDER BY h.effectiveStartDate DESC
        """)
    List<EmployeeDepartmentHistory> findLatestBaseTransfers(
        @Param("employeeId") Long employeeId,
        @Param("baseTypes") List<TransferType> baseTypes);

    List<EmployeeDepartmentHistory> findByCurrentTrueAndTransferTypeAndEffectiveEndDateBefore(
        TransferType transferType,
        LocalDate date);

    @Query("""
        SELECT CASE WHEN COUNT(h) > 0 THEN true ELSE false END FROM EmployeeDepartmentHistory h
        WHERE (h.toDepartment.id = :departmentId AND h.toPosition.id = :positionId)
           OR (h.fromDepartment.id = :departmentId AND h.fromPosition.id = :positionId)
        """)
    boolean existsByDepartmentAndPositionOnEitherSide(
        @Param("departmentId") Long departmentId,
        @Param("positionId") Long positionId);
}
