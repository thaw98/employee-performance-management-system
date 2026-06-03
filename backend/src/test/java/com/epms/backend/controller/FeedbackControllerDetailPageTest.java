package com.epms.backend.controller;

import com.epms.backend.common.ApiResponse;
import com.epms.backend.dto.FeedbackDetailPageDto;
import com.epms.backend.entity.Employee;
import com.epms.backend.entity.Role;
import com.epms.backend.entity.User;
import com.epms.backend.repository.DepartmentRepository;
import com.epms.backend.repository.UserRepository;
import com.epms.backend.service.FeedbackService;
import com.epms.backend.service.TimeSettingService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FeedbackControllerDetailPageTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void detailPageReturnsCurrentEmployeesFeedbackDetails() {
        FeedbackService feedbackService = mock(FeedbackService.class);
        UserRepository userRepository = mock(UserRepository.class);
        FeedbackController controller = new FeedbackController(
                feedbackService,
                mock(TimeSettingService.class),
                userRepository,
                mock(DepartmentRepository.class));
        User user = currentUser(99L, 10L);
        FeedbackDetailPageDto dto = new FeedbackDetailPageDto();
        dto.setId(1L);
        dto.setEvaluatorName("Evaluator");
        dto.setDetails(List.of());

        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("99", null));
        when(userRepository.findById(99L)).thenReturn(Optional.of(user));
        when(feedbackService.getFeedbackDetailPage(1L, 10L)).thenReturn(dto);

        ResponseEntity<ApiResponse<FeedbackDetailPageDto>> response = controller.getDetailPage(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getId()).isEqualTo(1L);
    }

    @Test
    void detailPageReturnsForbiddenForUnauthorizedFeedback() {
        FeedbackService feedbackService = mock(FeedbackService.class);
        UserRepository userRepository = mock(UserRepository.class);
        FeedbackController controller = new FeedbackController(
                feedbackService,
                mock(TimeSettingService.class),
                userRepository,
                mock(DepartmentRepository.class));
        User user = currentUser(99L, 10L);

        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("99", null));
        when(userRepository.findById(99L)).thenReturn(Optional.of(user));
        when(feedbackService.getFeedbackDetailPage(1L, 10L)).thenThrow(new SecurityException("Access denied"));

        ResponseEntity<ApiResponse<FeedbackDetailPageDto>> response = controller.getDetailPage(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(403);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isFalse();
    }

    @Test
    void hrRoleCanAccessAuditStyleDetailPage() {
        FeedbackService feedbackService = mock(FeedbackService.class);
        UserRepository userRepository = mock(UserRepository.class);
        FeedbackController controller = new FeedbackController(
                feedbackService,
                mock(TimeSettingService.class),
                userRepository,
                mock(DepartmentRepository.class));
        Role role = new Role();
        role.setId(1L);
        role.setName("HR");
        User user = new User();
        user.setId(1L);
        user.setRole(role);
        FeedbackDetailPageDto dto = new FeedbackDetailPageDto();
        dto.setId(1L);
        dto.setEvaluatorName("Evaluator");
        dto.setDetails(List.of());

        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("1", null));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(feedbackService.getAuditFeedbackDetailPage(1L)).thenReturn(dto);

        ResponseEntity<ApiResponse<FeedbackDetailPageDto>> response = controller.getDetailPage(1L);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getId()).isEqualTo(1L);
    }

    private static User currentUser(Long userId, Long employeeId) {
        Employee employee = new Employee();
        employee.setId(employeeId);
        User user = new User();
        user.setId(userId);
        user.setEmployee(employee);
        return user;
    }
}
