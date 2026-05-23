package com.epms.backend.repository;

import com.epms.backend.entity.Notification;
import com.epms.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long>, JpaSpecificationExecutor<Notification> {
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);

    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    long countByRecipientAndReadFalse(User recipient);

    Optional<Notification> findByIdAndRecipient(Long id, User recipient);

    List<Notification> findByRecipientAndReadFalse(User recipient);

    void deleteByRecipient(User recipient);

    Optional<Notification> findByRecipientAndSourceAndMessageStartingWith(User recipient, String source, String messagePrefix);

    boolean existsByRecipientAndSourceAndTargetIdAndTitle(User recipient, String source, Long targetId, String title);
}
