package com.hms.www.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class OtpVerifyRequest {

	@Pattern(regexp = "^\\d{10}$", message = "phone number should contain exactly 10 digits ")
	private String mobile;

	@Pattern(regexp = "^\\d{6}$", message = "OTP must be exactly 6 digits")
	private String otp;
}
