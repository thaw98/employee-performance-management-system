package com.epms.backend.config;

import com.epms.backend.entity.ScoreExplanationModule;
import java.util.List;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import javax.sql.DataSource;

@Component
public class ScoreExplanationMigrationInitializer implements BeanPostProcessor, Ordered {
    private record SeedRow(int sortOrder, int min, int max, String title, String details) {}

    private static final List<SeedRow> SEED_ROWS = List.of(
            new SeedRow(1, 86, 100, "Outstanding", "Consistently exceeds expectations and demonstrates exceptional performance."),
            new SeedRow(2, 71, 85, "Good", "Meets expectations with strong and reliable performance."),
            new SeedRow(3, 60, 70, "Meet Requirement", "Meets the required standard for the role."),
            new SeedRow(4, 40, 59, "Need Improvement", "Requires focused improvement to meet expectations."),
            new SeedRow(5, 0, 39, "Unsatisfactory", "Does not currently meet expected performance requirements."));

    @Override
    public int getOrder() {
        return 21;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("score explanation migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS score_explanation (
                    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                    module VARCHAR(40) NOT NULL,
                    sort_order INT NOT NULL,
                    min_score INT NOT NULL,
                    max_score INT NOT NULL,
                    title VARCHAR(120) NOT NULL,
                    details TEXT NOT NULL,
                    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    updated_by BIGINT NULL,
                    updated_by_role_id BIGINT NULL,
                    UNIQUE KEY uk_score_explanation_module_sort (module, sort_order)
                )
                """);

        for (ScoreExplanationModule module : ScoreExplanationModule.values()) {
            for (SeedRow row : SEED_ROWS) {
                jdbc.update("""
                        INSERT INTO score_explanation (module, sort_order, min_score, max_score, title, details)
                        SELECT ?, ?, ?, ?, ?, ?
                        WHERE NOT EXISTS (
                            SELECT 1 FROM score_explanation WHERE module = ? AND sort_order = ?
                        )
                        """,
                        module.name(), row.sortOrder(), row.min(), row.max(), row.title(), row.details(),
                        module.name(), row.sortOrder());
            }
        }
    }
}
