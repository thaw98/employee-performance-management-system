package com.epms.backend.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.epms.backend.domain.user.User;

public class UserPrincipal implements UserDetails {

	private final Long id;
	private final String email;
	private final String employeeId;
	private final String roleName;
	private final String passwordHash;
	private final boolean enabled;

	public UserPrincipal(User user) {
		this.id = user.getId();
		this.email = user.getEmail();
		this.employeeId = user.getEmployeeId();
		this.roleName = user.getRole().name();
		this.passwordHash = user.getPasswordHash();
		this.enabled = user.isEnabled();
	}

	public Long getId() {
		return id;
	}

	public String getEmployeeId() {
		return employeeId;
	}

	public String getRoleName() {
		return roleName;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + roleName));
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	@Override
	public String getUsername() {
		return String.valueOf(id);
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return enabled;
	}

	public String getEmail() {
		return email;
	}
}
