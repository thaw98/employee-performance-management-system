package com.epms.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "staff_type")
@Getter
@Setter
@NoArgsConstructor
public class StaffType {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "name", length = 100)
    private String name;
}
