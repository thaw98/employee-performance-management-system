package com.epms.backend.dto.continuousfeedback;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContinuousFeedbackListResponseDto {
    private List<ContinuousFeedbackDto> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private long totalShared;
    private long pendingAcknowledgment;
}
