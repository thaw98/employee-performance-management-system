package com.epms.backend.repository;

import com.epms.backend.entity.Signature;
import com.epms.backend.entity.User;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SignatureRepository extends JpaRepository<Signature, Long> {
    List<Signature> findByUser(User user);
    Optional<Signature> findByUserAndIsDefaultTrue(User user);
    Optional<Signature> findByIdAndUser(Long id, User user);
    long countByUser(User user);

    @Modifying
    @Query("update Signature s set s.isDefault = false where s.user = :user and s.isDefault = true")
    int clearDefaultForUser(@Param("user") User user);
}
