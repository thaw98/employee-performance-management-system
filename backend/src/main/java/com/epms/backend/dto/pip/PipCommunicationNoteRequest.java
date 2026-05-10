package com.epms.backend.dto.pip;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PipCommunicationNoteRequest {
    private String content;
    private String noteType;
}
