package com.hms.www.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hms.www.dto.OtpSendRequest;
import com.hms.www.dto.OtpVerifyRequest;
import com.hms.www.service.OtpService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/auth/otp")
@RequiredArgsConstructor
public class OtpController {

	private final OtpService otpService;

	@PostMapping("/send")
	public ResponseEntity<String> send(@RequestBody @Valid OtpSendRequest request) {
		return ResponseEntity.ok(otpService.sendOtp(request.getMobile()));
	}

	@PostMapping("/verify")
	public ResponseEntity<String> verify(@RequestBody @Valid OtpVerifyRequest request) {
		return ResponseEntity.ok(otpService.verifyOtp(request.getMobile(), request.getOtp()));
	}
}
