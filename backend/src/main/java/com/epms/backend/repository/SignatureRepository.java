package com.epms.backend.repository;

import com.epms.backend.entity.Signature;
import com.epms.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface SignatureRepository extends JpaRepository<Signature, Long> {
    List<Signature> findByUser(User user);
    Optional<Signature> findByUserAndIsDefaultTrue(User user);
}
