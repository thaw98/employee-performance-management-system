package com.epms.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.epms.backend.entity.PositionPermission;

public interface PositionPermissionRepository extends JpaRepository<PositionPermission, Long> {

    List<PositionPermission> findByPositionIdOrderByModuleKeyAscActionKeyAsc(Long positionId);

    List<PositionPermission> findByModuleKeyAndActionKeyOrderByPositionIdAsc(String moduleKey, String actionKey);

    @Query("SELECT pp FROM PositionPermission pp WHERE pp.position.id = :positionId AND pp.moduleKey = :moduleKey AND pp.actionKey = :actionKey")
    java.util.Optional<PositionPermission> findByPositionIdAndModuleKeyAndActionKey(
            @Param("positionId") Long positionId,
            @Param("moduleKey") String moduleKey,
            @Param("actionKey") String actionKey);

    @Modifying
    @Query("DELETE FROM PositionPermission pp WHERE pp.position.id = :positionId")
    void deleteByPositionId(@Param("positionId") Long positionId);

    @Query("SELECT pp FROM PositionPermission pp JOIN FETCH pp.position p LEFT JOIN FETCH p.levelCode LEFT JOIN FETCH p.role ORDER BY p.levelCode.code ASC, p.name ASC, pp.moduleKey ASC, pp.actionKey ASC")
    List<PositionPermission> findAllWithPosition();

    @Query("SELECT pp FROM PositionPermission pp WHERE pp.position.id IN :positionIds")
    List<PositionPermission> findByPositionIdIn(@Param("positionIds") List<Long> positionIds);
}
