package com.epms.backend.controller;

import com.epms.backend.entity.KpiName;
import com.epms.backend.repository.KpiNameRepository;
import com.epms.backend.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class KpiNameControllerTest {

    private final KpiNameRepository repository = mock(KpiNameRepository.class);
    private final KpiNameController controller = new KpiNameController(repository);
    private final UserPrincipal principal = mock(UserPrincipal.class);

    @Test
    void getAllNamesReturnsOnlyActiveNames() {
        KpiName active = new KpiName();
        active.setName("Quality of Work");
        active.setStatus("Active");
        when(repository.findByStatusIgnoreCase("Active")).thenReturn(List.of(active));

        var response = controller.getAllNames();

        assertThat(response.getBody()).containsExactly(active);
        verify(repository).findByStatusIgnoreCase("Active");
    }

    @Test
    void addNameTrimsAndSavesName() {
        KpiName request = new KpiName();
        request.setName("  Quality of Work  ");
        request.setDescription("  Employee output quality  ");
        when(principal.getId()).thenReturn(10L);
        when(repository.existsByNameIgnoreCase("Quality of Work")).thenReturn(false);
        when(repository.save(any(KpiName.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.addName(request, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        KpiName saved = (KpiName) response.getBody();
        assertThat(saved.getName()).isEqualTo("Quality of Work");
        assertThat(saved.getDescription()).isEqualTo("Employee output quality");
        assertThat(saved.getCreatedBy()).isEqualTo(10L);
        assertThat(saved.getStatus()).isEqualTo("Active");
    }

    @Test
    void addNameRejectsBlankName() {
        KpiName request = new KpiName();
        request.setName("   ");

        var response = controller.addName(request, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo("KPI name is required");
        verify(repository, never()).save(any());
    }

    @Test
    void addNameRejectsCaseInsensitiveDuplicate() {
        KpiName request = new KpiName();
        request.setName("quality of work");
        when(repository.existsByNameIgnoreCase("quality of work")).thenReturn(true);

        var response = controller.addName(request, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isEqualTo("KPI name already exists");
        verify(repository, never()).save(any());
    }

    @Test
    void deleteNameSoftDeactivatesName() {
        KpiName kpiName = new KpiName();
        kpiName.setName("Quality of Work");
        kpiName.setStatus("Active");
        when(principal.getId()).thenReturn(20L);
        when(repository.findById(1L)).thenReturn(Optional.of(kpiName));

        var response = controller.deleteName(1L, principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(kpiName.getStatus()).isEqualTo("Inactive");
        assertThat(kpiName.getUpdatedBy()).isEqualTo(20L);
        verify(repository).save(kpiName);
    }

    @Test
    void addAndDeleteAreHrOnly() throws Exception {
        Method addName = KpiNameController.class.getMethod("addName", KpiName.class, UserPrincipal.class);
        Method deleteName = KpiNameController.class.getMethod("deleteName", Long.class, UserPrincipal.class);

        assertThat(addName.getAnnotation(PreAuthorize.class).value()).isEqualTo("principal.roleId == 1");
        assertThat(deleteName.getAnnotation(PreAuthorize.class).value()).isEqualTo("principal.roleId == 1");
    }
}
