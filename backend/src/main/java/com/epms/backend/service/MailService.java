package com.epms.backend.service;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MailService {
	private final JavaMailSender mailSender;

	@Value("${spring.mail.username}")
	private String fromAddress;

	public void sendTemporaryPasswordEmail(String to, String employeeName, String temporaryPassword) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
			helper.setFrom(fromAddress);
			helper.setTo(to);
			helper.setSubject("Your EPMS login — temporary password");
			helper.setText(buildBody(employeeName, temporaryPassword), false);
			mailSender.send(message);
		} catch (MessagingException ex) {
			throw new IllegalStateException("Failed to send login email: " + ex.getMessage(), ex);
		}
	}

	private static String buildBody(String employeeName, String temporaryPassword) {
		String name = employeeName != null && !employeeName.isBlank() ? employeeName : "there";
		return """
				Hello %s,

				Your EPMS employee account has been created.

				Use this email address and the temporary password below to sign in. You will be asked to change your password on first login.

				Temporary password: %s

				If you did not expect this message, contact HR.

				— EPMS
				""".formatted(name, temporaryPassword);
	}
}
