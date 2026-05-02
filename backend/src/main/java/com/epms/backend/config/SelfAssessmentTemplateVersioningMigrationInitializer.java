package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.util.List;

/**
 * Introduces {@code self_assessment_form_template_version}, moves template questions to reference
 * {@code template_version_id}, and pins {@code self_assessment_form} rows to a version for audit.
 * Runs before Hibernate aligns schema on legacy databases that still had {@code template_id} on questions.
 */
@Component
public class SelfAssessmentTemplateVersioningMigrationInitializer implements BeanPostProcessor, Ordered {

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
            throw new BeanCreationException("self-assessment template versioning migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "self_assessment_form_template")) {
            return;
        }

        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS self_assessment_form_template_version (
                    id BIGINT NOT NULL AUTO_INCREMENT,
                    template_id BIGINT NOT NULL,
                    version_number INT NOT NULL,
                    created_by BIGINT NULL,
                    created_on DATETIME(6) NULL,
                    PRIMARY KEY (id),
                    UNIQUE KEY uk_saftv_template_version_no (template_id, version_number)
                )
                """);

        addForeignKeyIfMissing(
                jdbc,
                "self_assessment_form_template_version",
                "fk_saftv_template",
                "template_id",
                "self_assessment_form_template",
                "id");

        addColumnIfMissing(jdbc, "self_assessment_form_template_question", "template_version_id", "BIGINT NULL");
        addColumnIfMissing(jdbc, "self_assessment_form", "template_version_id", "BIGINT NULL");

        jdbc.update("""
                INSERT INTO self_assessment_form_template_version (template_id, version_number, created_by, created_on)
                SELECT t.id, 1, t.created_by, COALESCE(t.created_on, CURRENT_TIMESTAMP(6))
                FROM self_assessment_form_template t
                WHERE NOT EXISTS (
                    SELECT 1 FROM self_assessment_form_template_version v WHERE v.template_id = t.id
                )
                """);

        if (columnExists(jdbc, "self_assessment_form_template_question", "template_id")) {
            jdbc.update("""
                    UPDATE self_assessment_form_template_question q
                    INNER JOIN self_assessment_form_template_version v
                        ON v.template_id = q.template_id AND v.version_number = 1
                    SET q.template_version_id = v.id
                    WHERE q.template_version_id IS NULL
                      AND q.template_id IS NOT NULL
                    """);
        }

        dropForeignKeysOnColumn(jdbc, "self_assessment_form_template_question", "template_id");
        if (columnExists(jdbc, "self_assessment_form_template_question", "template_id")) {
            jdbc.execute("ALTER TABLE self_assessment_form_template_question DROP COLUMN template_id");
        }

        if (columnExists(jdbc, "self_assessment_form_template_question", "template_version_id")) {
            Integer nullQuestions = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM self_assessment_form_template_question WHERE template_version_id IS NULL",
                    Integer.class);
            if (nullQuestions != null && nullQuestions == 0) {
                jdbc.execute("ALTER TABLE self_assessment_form_template_question MODIFY template_version_id BIGINT NOT NULL");
            }
        }

        addForeignKeyIfMissing(
                jdbc,
                "self_assessment_form_template_question",
                "fk_saftq_template_version",
                "template_version_id",
                "self_assessment_form_template_version",
                "id");

        if (columnExists(jdbc, "self_assessment_form", "template_id")) {
            jdbc.update("""
                    UPDATE self_assessment_form f
                    INNER JOIN self_assessment_form_template_version v
                        ON v.template_id = f.template_id AND v.version_number = 1
                    SET f.template_version_id = v.id
                    WHERE f.template_version_id IS NULL AND f.template_id IS NOT NULL
                    """);
        }

        if (columnExists(jdbc, "self_assessment_form", "template_version_id")) {
            Integer nullForms = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM self_assessment_form WHERE template_version_id IS NULL",
                    Integer.class);
            if (nullForms != null && nullForms == 0) {
                jdbc.execute("ALTER TABLE self_assessment_form MODIFY template_version_id BIGINT NOT NULL");
            }
        }

        addForeignKeyIfMissing(
                jdbc,
                "self_assessment_form",
                "fk_saff_template_version",
                "template_version_id",
                "self_assessment_form_template_version",
                "id");
    }

    private static void addForeignKeyIfMissing(
            JdbcTemplate jdbc,
            String tableName,
            String constraintName,
            String columnName,
            String refTable,
            String refColumn) {
        if (!tableExists(jdbc, tableName) || !columnExists(jdbc, tableName, columnName)) {
            return;
        }
        if (foreignKeyExists(jdbc, tableName, constraintName)) {
            return;
        }
        jdbc.execute("""
                ALTER TABLE `%s` ADD CONSTRAINT `%s` FOREIGN KEY (`%s`) REFERENCES `%s` (`%s`)
                """.formatted(tableName, constraintName, columnName, refTable, refColumn));
    }

    private static boolean foreignKeyExists(JdbcTemplate jdbc, String tableName, String constraintName) {
        Integer count = jdbc.queryForObject("""
                        SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                        WHERE CONSTRAINT_SCHEMA = DATABASE()
                          AND TABLE_NAME = ?
                          AND CONSTRAINT_NAME = ?
                          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                        """,
                Integer.class,
                tableName,
                constraintName);
        return count != null && count > 0;
    }

    private static void dropForeignKeysOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
        if (!tableExists(jdbc, tableName) || !columnExists(jdbc, tableName, columnName)) {
            return;
        }
        List<String> names = jdbc.query("""
                        SELECT DISTINCT CONSTRAINT_NAME
                        FROM information_schema.KEY_COLUMN_USAGE
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = ?
                          AND COLUMN_NAME = ?
                          AND REFERENCED_TABLE_NAME IS NOT NULL
                        """,
                (rs, rowNum) -> rs.getString(1),
                tableName,
                columnName);
        for (String name : names) {
            if (name != null) {
                jdbc.execute("ALTER TABLE `" + tableName + "` DROP FOREIGN KEY `" + name + "`");
            }
        }
    }

    private static void addColumnIfMissing(JdbcTemplate jdbc, String tableName, String columnName, String definition) {
        if (!tableExists(jdbc, tableName)) {
            return;
        }
        if (!columnExists(jdbc, tableName, columnName)) {
            jdbc.execute("ALTER TABLE `" + tableName + "` ADD COLUMN `" + columnName + "` " + definition);
        }
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                        """,
                Boolean.class,
                tableName));
    }

    private static boolean columnExists(JdbcTemplate jdbc, String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                        """,
                Boolean.class,
                tableName,
                columnName));
    }
}
