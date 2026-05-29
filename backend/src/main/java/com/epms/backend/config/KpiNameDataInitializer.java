package com.epms.backend.config;

import com.epms.backend.entity.KpiName;
import com.epms.backend.repository.KpiNameRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class KpiNameDataInitializer implements CommandLineRunner {

    private static final List<String> KPI_TABLES = List.of(
            "employeekpis",
            "position_kpis",
            "department_kpis",
            "kpi_template_items"
    );

    private final JdbcTemplate jdbcTemplate;
    private final KpiNameRepository kpiNameRepository;

    @Override
    public void run(String... args) {
        Set<String> normalizedExistingNames = new LinkedHashSet<>();
        kpiNameRepository.findAll().forEach(kpiName ->
                normalizedExistingNames.add(normalizeKey(kpiName.getName()))
        );

        int created = 0;
        for (String importedName : importDistinctNames()) {
            String key = normalizeKey(importedName);
            if (key.isEmpty() || normalizedExistingNames.contains(key)) {
                continue;
            }

            KpiName kpiName = new KpiName();
            kpiName.setName(importedName);
            kpiName.setStatus("Active");
            kpiNameRepository.save(kpiName);
            normalizedExistingNames.add(key);
            created++;
        }

        if (created > 0) {
            log.info("Imported {} KPI names from existing KPI records/templates", created);
        }
    }

    List<String> importDistinctNames() {
        Set<String> imported = new LinkedHashSet<>();
        for (String tableName : KPI_TABLES) {
            if (!tableExists(tableName) || !columnExists(tableName, "name")) {
                continue;
            }
            jdbcTemplate.queryForList(
                    "SELECT DISTINCT TRIM(name) FROM `" + tableName + "` WHERE name IS NOT NULL AND TRIM(name) <> ''",
                    String.class
            ).forEach(name -> {
                String trimmed = trimToNull(name);
                if (trimmed != null) {
                    imported.add(trimmed);
                }
            });
        }
        return List.copyOf(imported);
    }

    private boolean tableExists(String tableName) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                        """,
                Boolean.class,
                tableName));
    }

    private boolean columnExists(String tableName, String columnName) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                        """,
                Boolean.class,
                tableName,
                columnName));
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String normalizeKey(String value) {
        String trimmed = trimToNull(value);
        return trimmed == null ? "" : trimmed.toLowerCase(Locale.ROOT);
    }
}
