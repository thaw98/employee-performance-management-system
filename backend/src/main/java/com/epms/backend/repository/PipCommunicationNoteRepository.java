package com.epms.backend.repository;

import com.epms.backend.entity.PipCommunicationNote;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipCommunicationNoteRepository extends JpaRepository<PipCommunicationNote, Long>, JpaSpecificationExecutor<PipCommunicationNote> {

    @EntityGraph(attributePaths = {
            "pip",
            "pip.employee",
            "pip.manager",
            "author",
            "author.employee"
    })
    List<PipCommunicationNote> findByPip_IdOrderByCreatedDateDesc(Long pipId);

    @Override
    @EntityGraph(attributePaths = {
            "pip",
            "pip.employee",
            "pip.manager",
            "author",
            "author.employee"
    })
    Optional<PipCommunicationNote> findById(Long id);
}
