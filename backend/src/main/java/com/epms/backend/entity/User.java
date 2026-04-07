package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

	@Column(name = "employee_id", nullable = false, unique = true, length = 64)
	private String employeeId;

	@Column(nullable = false, unique = true, length = 255)
	private String email;

	@Column(name = "password", nullable = false, length = 255)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private Role role;

	@Column(name = "profile_picture_base64", columnDefinition = "LONGTEXT")
	private String profilePictureBase64;

	@Column(nullable = false)
	private boolean enabled = true;
}
