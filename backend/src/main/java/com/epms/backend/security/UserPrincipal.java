package com.epms.backend.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.epms.backend.entity.Employee;
import com.epms.backend.entity.User;

public class UserPrincipal implements UserDetails {

	private final Long id;
	private final String email;
	private final String employeeId;
	private final Long roleId;
	private final String roleName;
	private final String name;
	private final String password;
	private final boolean active;
	private final boolean mustChangePassword;

	public UserPrincipal(User user) {
		this.id = user.getId();
		this.email = user.getEmail();
		this.employeeId = resolveBusinessEmployeeId(user.getEmployee());
		this.roleId = (user.getRole() != null) ? user.getRole().getId() : 0L;
		this.roleName = (user.getRole() != null) ? user.getRole().getName() : "GUEST";
		this.name = (user.getEmployee() != null) ? user.getEmployee().getEmployeeName() : "User";
		this.password = user.getPassword();
		this.active = user.isActive();
		this.mustChangePassword = user.isMustChangePassword();
	}

	public boolean isMustChangePassword() {
		return mustChangePassword;
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

	public Long getRoleId() {
		return roleId;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		String authorityRole = roleName.trim().toUpperCase().replace(' ', '_');
		return List.of(new SimpleGrantedAuthority("ROLE_" + authorityRole));
	}

	@Override
	public String getPassword() {
		return password;
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
		return active;
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	private static String resolveBusinessEmployeeId(Employee employee) {
		if (employee == null) {
			return "NONE";
		}
		String businessId = employee.getEmployeeId();
		if (businessId != null && !businessId.isBlank()) {
			return businessId.trim();
		}
		return String.valueOf(employee.getId());
	}
}
