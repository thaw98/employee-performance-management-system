package com.epms.backend.entity;

//MNA
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "kpi_templates")
public class KpiTemplate {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "name", length = 200, nullable = false)
	private String name;

	@Column(name = "category", length = 100)
	private String category;

	@Column(name = "target_description", columnDefinition = "TEXT")
	private String targetDescription;

	@Column(name = "dynamic_fields", columnDefinition = "JSON")
	private String dynamicFields; // Stored as JSON string

	@CreationTimestamp
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;
}
