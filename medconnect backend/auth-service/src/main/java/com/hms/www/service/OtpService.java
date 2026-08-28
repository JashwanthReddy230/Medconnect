package com.hms.www.service;

public interface OtpService {

	/**
	 * Generates a fresh 6-digit OTP for the given mobile, stores only its hash,
	 * and prints the plaintext code to the server console/logs (dev/test only).
	 * Enforces a resend cooldown. Never returns the OTP itself.
	 */
	String sendOtp(String mobile);

	/**
	 * Verifies the OTP for the given mobile against the latest stored hash,
	 * checking expiry and attempt count.
	 */
	String verifyOtp(String mobile, String otp);

	/**
	 * Used by registration to enforce that a mobile number was actually
	 * OTP-verified (and recently — not a stale verification) before allowing
	 * account creation for OTP-gated roles (Patient/Doctor).
	 */
	boolean isMobileVerified(String mobile);

	/**
	 * Consumes (invalidates) a verified OTP after it has been used for
	 * registration, so it can't be replayed for a second signup.
	 */
	void consumeVerification(String mobile);
}
