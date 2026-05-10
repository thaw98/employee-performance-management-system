package com.epms.backend.dto.pip;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class PipCommunicationNoteDto {
    private Long id;
    private Long pipId;
    private String content;
    private String noteType;
    private AuthorDto author;
    private PipPersonDto employee;
    private PipPersonDto manager;
    private String pipStatus;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @AllArgsConstructor
    public static class AuthorDto {
        private Long id;
        private String email;
        private EmployeeDto employee;
    }

    @Getter
    @AllArgsConstructor
    public static class EmployeeDto {
        private Long id;
        private String employeeName;
        private String employeeId;
    }

    @Getter
    @AllArgsConstructor
    public static class PipPersonDto {
        private Long id;
        private String employeeName;
        private String employeeId;
    }
}
