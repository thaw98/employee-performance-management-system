package com.epms.backend.audit;

public final class AuditActionType {
	private AuditActionType() {
	}

	public static final String EMPLOYEE_ACCOUNT_CREATED = "EMPLOYEE_ACCOUNT_CREATED";
	public static final String TEMP_PASSWORD_RESENT = "TEMP_PASSWORD_RESENT";
	public static final String PASSWORD_CHANGED_FIRST_LOGIN = "PASSWORD_CHANGED_FIRST_LOGIN";
	public static final String EMPLOYEE_INFO_UPDATED = "EDIT_EMPLOYEE_INFO";
	public static final String NEW_TEMP_PASSWORD_SENT = "SEND_NEW_TEMP_PASSWORD";
	public static final String EMPLOYMENT_STATUS_UPDATED = "EMPLOYMENT_STATUS_UPDATED";
	public static final String FORGOT_PASSWORD_OTP_SENT = "FORGOT_PASSWORD_OTP_SENT";
	public static final String FORGOT_PASSWORD_OTP_RESENT = "FORGOT_PASSWORD_OTP_RESENT";
	public static final String FORGOT_PASSWORD_OTP_VERIFIED = "FORGOT_PASSWORD_OTP_VERIFIED";
	public static final String FORGOT_PASSWORD_RESET_SUCCESS = "FORGOT_PASSWORD_RESET_SUCCESS";
	public static final String FORGOT_PASSWORD_RESET_FAILED = "FORGOT_PASSWORD_RESET_FAILED";
}
