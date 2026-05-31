package com.epms.backend.config;

import com.epms.backend.entity.ScoreFormulaArea;
import java.util.List;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;

@Component
public class ScoreFormulaMigrationInitializer implements BeanPostProcessor, Ordered {

    private record SeedFormula(String name, String area, String definition, String description) {}

    private static final String BASE_EXPRESSION = """
            {"expression":{"type":"multiply","left":{"type":"divide","left":{"type":"input","name":"SUM_RATINGS"},"right":{"type":"multiply","left":{"type":"input","name":"NUM_QUESTIONS"},"right":{"type":"input","name":"MAX_RATING"}}},"right":{"type":"literal","value":100}}}
            """.trim();

    private static final List<SeedFormula> SEED_FORMULAS = List.of(
            new SeedFormula("Self-Assessment Default",
                    ScoreFormulaArea.SELF_ASSESSMENT.name(),
                    BASE_EXPRESSION,
                    "Computes score as (sum of ratings / (number of questions * max rating)) * 100. Ratings use final-approved → manager → employee fallback order."),
            new SeedFormula("360 Feedback Default",
                    ScoreFormulaArea.FEEDBACK_360.name(),
                    BASE_EXPRESSION,
                    "Computes score as (sum of ratings / (number of criteria * 5)) * 100. Max rating is fixed at 5."),
            new SeedFormula("Appraisal Default",
                    ScoreFormulaArea.APPRAISAL.name(),
                    BASE_EXPRESSION,
                    "Computes score as (sum of ratings / (number of answers * max rating)) * 100. Max rating from appraisal template."));

    @Override
    public int getOrder() {
        return 22;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("score formula migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS score_formula (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    area VARCHAR(40) NOT NULL,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    is_default TINYINT(1) NOT NULL DEFAULT 0,
                    definition TEXT NOT NULL,
                    description TEXT NULL,
                    created_by BIGINT NOT NULL,
                    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    updated_by BIGINT NULL,
                    updated_at DATETIME(6) NULL,
                    inactivated_by BIGINT NULL,
                    inactivated_at DATETIME(6) NULL,
                    INDEX idx_score_formula_area (area),
                    INDEX idx_score_formula_area_default (area, is_default)
                )
                """);

        for (SeedFormula seed : SEED_FORMULAS) {
            jdbc.update("""
                    INSERT INTO score_formula (name, area, is_active, is_default, definition, description, created_by, created_at)
                    SELECT ?, ?, 1, 1, ?, ?, 1, NOW()
                    WHERE NOT EXISTS (
                        SELECT 1 FROM score_formula WHERE area = ? AND is_default = 1
                    )
                    """,
                    seed.name(), seed.area(), seed.definition(), seed.description(), seed.area());
        }
    }
}
