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
 * Removes {@code self_assessment_form_template_version}: template questions reference {@code template_id} directly,
 * and assigned forms no longer store {@code template_version_id}.
 */
@Component
public class SelfAssessmentTemplateVersionRemovalMigrationInitializer implements BeanPostProcessor, Ordered {

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
            throw new BeanCreationException("self-assessment template version removal migration failed", e);
        }
        return bean;
    }

    private void migrate(JdbcTemplate jdbc) {
        if (!tableExists(jdbc, "self_assessment_form_template")) {
            return;
        }

        addColumnIfMissing(jdbc, "self_assessment_form_template_question", "template_id", "BIGINT NULL");
        addColumnIfMissing(jdbc, "self_assessment_form_template_question", "deleted_at", "DATETIME(6) NULL");
        addColumnIfMissing(jdbc, "self_assessment_form_template_question", "deleted_by", "BIGINT NULL");

        boolean hadVersionOnQuestions = columnExists(jdbc, "self_assessment_form_template_question", "template_version_id");
        if (hadVersionOnQuestions && tableExists(jdbc, "self_assessment_form_template_version")) {
            jdbc.update("""
                    UPDATE self_assessment_form_template_question q
                    INNER JOIN self_assessment_form_template_version v ON v.id = q.template_version_id
                    INNER JOIN (
                        SELECT template_id AS tid, MAX(version_number) AS mx
                        FROM self_assessment_form_template_version
                        GROUP BY template_id
                    ) latest ON latest.tid = v.template_id AND latest.mx = v.version_number
                    SET q.template_id = v.template_id
                    WHERE q.template_id IS NULL
                    """);
            jdbc.update("""
                    DELETE FROM self_assessment_form_template_question
                    WHERE template_id IS NULL
                    """);
        }

        dropForeignKeysOnColumn(jdbc, "self_assessment_form_template_question", "template_version_id");
        if (columnExists(jdbc, "self_assessment_form_template_question", "template_version_id")) {
            jdbc.execute("ALTER TABLE self_assessment_form_template_question DROP COLUMN template_version_id");
        }

        if (columnExists(jdbc, "self_assessment_form_template_question", "template_id")) {
            Integer nullTemplates = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM self_assessment_form_template_question WHERE template_id IS NULL",
                    Integer.class);
            if (nullTemplates != null && nullTemplates == 0) {
                jdbc.execute("ALTER TABLE self_assessment_form_template_question MODIFY template_id BIGINT NOT NULL");
            }
        }

        addForeignKeyIfMissing(
                jdbc,
                "self_assessment_form_template_question",
                "fk_saftq_template",
                "template_id",
                "self_assessment_form_template",
                "id");

        dropForeignKeysOnColumn(jdbc, "self_assessment_form", "template_version_id");
        if (columnExists(jdbc, "self_assessment_form", "template_version_id")) {
            jdbc.execute("ALTER TABLE self_assessment_form DROP COLUMN template_version_id");
        }

        if (tableExists(jdbc, "self_assessment_form_template_version")) {
            jdbc.execute("DROP TABLE IF EXISTS self_assessment_form_template_version");
        }
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
