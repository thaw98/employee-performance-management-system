package com.epms.backend.validation;

import java.util.regex.Pattern;

public final class MyanmarNrcValidator {

	private static final Pattern NRC_PATTERN = Pattern
			.compile("^\\d{1,2}/[A-Za-z]{2,10}\\([A-Za-z]{1,3}\\)\\d{6}$");

	private MyanmarNrcValidator() {
	}

	/**
	 * @param nrc trimmed or untrimmed; blank is treated as valid (optional field).
	 */
	public static boolean isValidOptional(String nrc) {
		if (nrc == null || nrc.isBlank()) {
			return true;
		}
		return NRC_PATTERN.matcher(nrc.trim()).matches();
	}

	/** Non-blank NRC that matches the canonical Myanmar NRC format. */
	public static boolean isValidRequired(String nrc) {
		if (nrc == null || nrc.isBlank()) {
			return false;
		}
		return NRC_PATTERN.matcher(nrc.trim()).matches();
	}
}
