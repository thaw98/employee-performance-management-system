package com.epms.backend.repository;

import com.epms.backend.entity.ScoreFormula;
import com.epms.backend.entity.ScoreFormulaArea;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoreFormulaRepository extends JpaRepository<ScoreFormula, Long> {

    List<ScoreFormula> findByAreaOrderByCreatedAtDesc(ScoreFormulaArea area);

    Optional<ScoreFormula> findByAreaAndIsDefaultTrue(ScoreFormulaArea area);

    Optional<ScoreFormula> findByAreaAndIsDefaultTrueAndActiveTrue(ScoreFormulaArea area);

    List<ScoreFormula> findByAreaAndActiveTrue(ScoreFormulaArea area);

    long countByAreaAndIsDefaultTrue(ScoreFormulaArea area);
}
