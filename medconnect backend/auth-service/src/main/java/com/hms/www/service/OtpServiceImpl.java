package com.hms.www.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.hms.www.entity.Otp;
import com.hms.www.repository.OtpRepository;

@Service
public class OtpServiceImpl implements OtpService {

	private static final Logger log = LoggerFactory.getLogger(OtpServiceImpl.class);

	private static final int OTP_LENGTH = 6;
	private static final long OTP_EXPIRY_MINUTES = 5;
	private static final long RESEND_COOLDOWN_SECONDS = 30;
	private static final int MAX_VERIFY_ATTEMPTS = 5;
	private static final long VERIFIED_FRESHNESS_MINUTES = 30;

	private final SecureRandom random = new SecureRandom();

	@Autowired
	private OtpRepository otpRepository;

	@Override
	public String sendOtp(String mobile) {

		otpRepository.findTopByMobileOrderByCreatedAtDesc(mobile).ifPresent(existing -> {
			long secondsSinceLastSend = ChronoUnit.SECONDS.between(existing.getCreatedAt(), LocalDateTime.now());
			if (secondsSinceLastSend < RESEND_COOLDOWN_SECONDS) {
				throw new RuntimeException(
						"Please wait " + (RESEND_COOLDOWN_SECONDS - secondsSinceLastSend) + "s before requesting a new OTP");
			}
		});

		String code = generateOtp();

		Otp otp = new Otp();
		otp.setMobile(mobile);
		otp.setOtpHash(hash(code));
		otp.setCreatedAt(LocalDateTime.now());
		otp.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
		otp.setVerified(false);
		otp.setAttempts(0);

		otpRepository.save(otp);

		// Dev/test only — never sent in the API response, never persisted in
		// plaintext. Swap this for an SMS provider (Twilio/MSG91/AWS SNS) in
		// production by replacing this single log line with a provider call.
		log.info("========================================");
		log.info("OTP for mobile {}: {}", mobile, code);
		log.info("Expires in {} minutes", OTP_EXPIRY_MINUTES);
		log.info("========================================");

		return "OTP sent successfully. It will expire in " + OTP_EXPIRY_MINUTES + " minutes.";
	}

	@Override
	public String verifyOtp(String mobile, String code) {

		Otp otp = otpRepository.findTopByMobileOrderByCreatedAtDesc(mobile)
				.orElseThrow(() -> new RuntimeException("No OTP was requested for this mobile number"));

		if (otp.isVerified()) {
			return "Mobile number already verified";
		}

		if (LocalDateTime.now().isAfter(otp.getExpiresAt())) {
			throw new RuntimeException("OTP has expired. Please request a new one.");
		}

		if (otp.getAttempts() >= MAX_VERIFY_ATTEMPTS) {
			throw new RuntimeException("Too many incorrect attempts. Please request a new OTP.");
		}

		if (!otp.getOtpHash().equals(hash(code))) {
			otp.setAttempts(otp.getAttempts() + 1);
			otpRepository.save(otp);
			throw new RuntimeException("Invalid OTP");
		}

		otp.setVerified(true);
		otp.setVerifiedAt(LocalDateTime.now());
		otpRepository.save(otp);

		return "Mobile number verified successfully";
	}

	@Override
	public boolean isMobileVerified(String mobile) {

		return otpRepository.findTopByMobileOrderByCreatedAtDesc(mobile)
				.filter(Otp::isVerified)
				.filter(otp -> otp.getVerifiedAt() != null
						&& ChronoUnit.MINUTES.between(otp.getVerifiedAt(), LocalDateTime.now()) <= VERIFIED_FRESHNESS_MINUTES)
				.isPresent();
	}

	@Override
	public void consumeVerification(String mobile) {

		otpRepository.findTopByMobileOrderByCreatedAtDesc(mobile)
				.filter(Otp::isVerified)
				.ifPresent(otp -> {
					// Push it out of the freshness window instead of deleting, so the
					// audit trail (who verified what, when) is preserved.
					otp.setVerifiedAt(otp.getVerifiedAt().minusMinutes(VERIFIED_FRESHNESS_MINUTES + 1));
					otpRepository.save(otp);
				});
	}

	private String generateOtp() {
		int code = 100000 + random.nextInt(900000);
		return String.valueOf(code);
	}

	private String hash(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] bytes = digest.digest(value.getBytes());
			StringBuilder sb = new StringBuilder();
			for (byte b : bytes) {
				sb.append(String.format("%02x", b));
			}
			return sb.toString();
		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("Failed to hash OTP", e);
		}
	}
}
