package com.epms.backend.config;

import com.epms.backend.entity.KpiName;
import com.epms.backend.repository.KpiNameRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class KpiNameDataInitializerTest {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final KpiNameRepository repository = mock(KpiNameRepository.class);
    private final KpiNameDataInitializer initializer = new KpiNameDataInitializer(jdbcTemplate, repository);

    @Test
    void runImportsDistinctNonblankNamesWithoutCaseInsensitiveDuplicates() {
        KpiName existing = new KpiName();
        existing.setName("Quality of Work");
        when(repository.findAll()).thenReturn(List.of(existing));
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), anyString())).thenReturn(true);
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), anyString(), eq("name"))).thenReturn(true);
        when(jdbcTemplate.queryForList(contains("employeekpis"), eq(String.class)))
                .thenReturn(List.of(" Quality of Work ", "Sales Target", " "));
        when(jdbcTemplate.queryForList(contains("position_kpis"), eq(String.class)))
                .thenReturn(List.of("sales target", "Customer Satisfaction"));
        when(jdbcTemplate.queryForList(contains("department_kpis"), eq(String.class))).thenReturn(List.of());
        when(jdbcTemplate.queryForList(contains("kpi_template_items"), eq(String.class))).thenReturn(List.of("Customer Satisfaction"));

        initializer.run();

        verify(repository, times(2)).save(any(KpiName.class));
        verify(repository).save(argThat(kpiName -> "Sales Target".equals(kpiName.getName()) && "Active".equals(kpiName.getStatus())));
        verify(repository).save(argThat(kpiName -> "Customer Satisfaction".equals(kpiName.getName()) && "Active".equals(kpiName.getStatus())));
    }

    @Test
    void importDistinctNamesSkipsMissingTables() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), eq("employeekpis"))).thenReturn(false);
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), eq("position_kpis"))).thenReturn(false);
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), eq("department_kpis"))).thenReturn(false);
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), eq("kpi_template_items"))).thenReturn(false);

        assertThat(initializer.importDistinctNames()).isEmpty();
        verify(jdbcTemplate, never()).queryForList(anyString(), eq(String.class));
    }
}
