package com.epms.backend.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class FeedbackDetailPageDto extends FeedbackHistoryDto {
    private List<FeedbackDetailDto> details;
}
