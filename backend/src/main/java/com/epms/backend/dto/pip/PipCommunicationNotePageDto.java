package com.epms.backend.dto.pip;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class PipCommunicationNotePageDto {
    private List<PipCommunicationNoteDto> content;
    private int totalPages;
    private long totalElements;
    private int currentPage;
    private boolean hasNext;
}
