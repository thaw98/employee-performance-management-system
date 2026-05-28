package com.epms.backend.controller;

import com.epms.backend.dto.FeedbackAuditSummaryPageDto;
import com.epms.backend.dto.FeedbackAuditTotalsDto;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.FeedbackService;
import com.epms.backend.service.TimeSettingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FeedbackAuditControllerAccessTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void auditRoleCanAccessAuditSummaryEndpoint() {
        FeedbackService feedbackService = mock(FeedbackService.class);
        UserRepository userRepository = mock(UserRepository.class);
        FeedbackController controller = new FeedbackController(
                feedbackService,
                mock(TimeSettingService.class),
                userRepository,
                mock(DepartmentRepository.class));

        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("5", null));
        when(userRepository.findById(5L)).thenReturn(Optional.of(user(5L, "AUDIT")));
        when(feedbackService.getAuditHistorySummary(any(), any())).thenReturn(new FeedbackAuditSummaryPageDto(
                List.of(),
                0,
                10,
                0,
                0L,
                new FeedbackAuditTotalsDto(0L, 0L, 0L, 0L, 0d)));

        ResponseEntity<?> response = controller.getAuditHistorySummary(0, 10, null, null, null, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    void nonAuditRoleReceivesForbiddenForAuditSummaryEndpoint() {
        UserRepository userRepository = mock(UserRepository.class);
        FeedbackController controller = new FeedbackController(
                mock(FeedbackService.class),
                mock(TimeSettingService.class),
                userRepository,
                mock(DepartmentRepository.class));

        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("2", null));
        when(userRepository.findById(2L)).thenReturn(Optional.of(user(2L, "MANAGER")));

        ResponseEntity<?> response = controller.getAuditHistorySummary(0, 10, null, null, null, null, null, null);

        assertThat(response.getStatusCode().value()).isEqualTo(403);
    }

    private static User user(Long roleId, String roleName) {
        Role role = new Role();
        role.setId(roleId);
        role.setName(roleName);
        User user = new User();
        user.setRole(role);
        return user;
    }
}
