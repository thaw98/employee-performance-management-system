package com.epms.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.epms.backend.entity.Position;
import com.epms.backend.entity.Role;
import com.epms.backend.repository.PositionRepository;

@ExtendWith(MockitoExtension.class)
class PositionRoleResolutionServiceTest {

	@Mock
	private PositionRepository positionRepository;

	private PositionRoleResolutionService service;

	@BeforeEach
	void setUp() {
		service = new PositionRoleResolutionService(positionRepository);
	}

	@Test
	void resolveFromPositionId_throwsWhenMissing() {
		when(positionRepository.findByIdWithLevelCodeAndRole(eq(99L))).thenReturn(Optional.empty());
		assertThrows(IllegalArgumentException.class, () -> service.resolveRoleFromPositionId(99L));
	}

	@Test
	void resolveFromPositionId_throwsWhenInactive() {
		Position p = new Position();
		p.setId(1L);
		p.setStatus("inactive");
		p.setRole(newRole(4L, "Employee"));
		when(positionRepository.findByIdWithLevelCodeAndRole(eq(1L))).thenReturn(Optional.of(p));
		IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
				() -> service.resolveRoleFromPositionId(1L));
		assertEquals("Selected position is inactive and cannot be assigned.", ex.getMessage());
	}

	@Test
	void resolveFromPositionId_throwsWhenNoRole() {
		Position p = new Position();
		p.setId(1L);
		p.setStatus("active");
		when(positionRepository.findByIdWithLevelCodeAndRole(eq(1L))).thenReturn(Optional.of(p));
		IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
				() -> service.resolveRoleFromPositionId(1L));
		assertEquals("Selected position has no linked role.", ex.getMessage());
	}

	@Test
	void resolveFromPositionId_returnsRole() {
		Role r = newRole(2L, "Team Head");
		Position p = new Position();
		p.setId(1L);
		p.setStatus("active");
		p.setRole(r);
		when(positionRepository.findByIdWithLevelCodeAndRole(eq(1L))).thenReturn(Optional.of(p));
		assertEquals(2L, service.resolveRoleFromPositionId(1L).getId().longValue());
	}

	@Test
	void resolveFromLoadedPosition_blankStatusTreatedAsActive() {
		Role r = newRole(4L, "Employee");
		Position p = new Position();
		p.setStatus("  ");
		p.setRole(r);
		assertEquals(4L, service.resolveRoleFromLoadedPosition(p).getId().longValue());
	}

	private static Role newRole(long id, String name) {
		Role r = new Role();
		r.setId(id);
		r.setName(name);
		return r;
	}
}
