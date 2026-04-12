package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "staff_type")
public class StaffType {

	@Id
	private Long id;

	@Column(nullable = false, unique = true, length = 100)
	private String name;
}
