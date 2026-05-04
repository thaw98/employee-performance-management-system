package com.epms.backend.config;

import java.util.Locale;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Removes legacy self-assessment tables whose JPA mappings were deleted.
 * <p>
 * {@code spring.jpa.hibernate.ddl-auto=update} only creates/alters columns for
 * <em>current</em> entities; it never drops orphaned tables. This runs on the
 * {@link DataSource} before the persistence layer uses it, using idempotent DDL.
 */
@Component
public class LegacySelfAssessmentTablesDropInitializer implements BeanPostProcessor, Ordered {

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
            dropLegacyTables(new JdbcTemplate(dataSource));
        } catch (Exception e) {
            throw new BeanCreationException("legacy self-assessment table drop failed", e);
        }
        return bean;
    }

    private void dropLegacyTables(JdbcTemplate jdbc) {
        boolean mysql = Boolean.TRUE.equals(jdbc.execute((ConnectionCallback<Boolean>) conn -> {
            String name = conn.getMetaData().getDatabaseProductName();
            return name != null && name.toLowerCase(Locale.ROOT).contains("mysql");
        }));

        if (mysql) {
            jdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
        }
        try {
            jdbc.execute("DROP TABLE IF EXISTS self_assessment_answer");
            jdbc.execute("DROP TABLE IF EXISTS self_assessment");
            jdbc.execute("DROP TABLE IF EXISTS self_assessment_question");
        } finally {
            if (mysql) {
                jdbc.execute("SET FOREIGN_KEY_CHECKS = 1");
            }
        }
    }
}
