package com.epms.backend.dto.user;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserAccountStatusRequestDto {
	@NotNull
	private Boolean active;
}
