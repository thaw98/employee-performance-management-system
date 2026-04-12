package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(optional = false)
	@JoinColumn(name = "employee_id", nullable = false, unique = true)
	private Employee employee;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(name = "password", nullable = false, length = 255)
	private String password;

	@ManyToOne(optional = false)
	@JoinColumn(name = "role_id", nullable = false)
	private Role role;

	@Column(name = "is_active", nullable = false)
	private boolean active = true;

	// Legacy schema compatibility for environments where `users.enabled` still
	// exists.
	@Column(name = "enabled")
	private Boolean enabled;

	@Column(name = "must_change_password", nullable = false)
	private boolean mustChangePassword = true;

	@PrePersist
	@PreUpdate
	private void syncLegacyEnabledColumn() {
		this.enabled = this.active;
	}
}
