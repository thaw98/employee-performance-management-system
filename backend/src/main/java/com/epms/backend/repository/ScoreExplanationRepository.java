package com.epms.backend.repository;

import com.epms.backend.entity.ScoreExplanation;
import com.epms.backend.entity.ScoreExplanationModule;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScoreExplanationRepository extends JpaRepository<ScoreExplanation, Long> {
    List<ScoreExplanation> findByModuleOrderBySortOrderAsc(ScoreExplanationModule module);

    Optional<ScoreExplanation> findByModuleAndSortOrder(ScoreExplanationModule module, Integer sortOrder);

    long countByModule(ScoreExplanationModule module);
}
