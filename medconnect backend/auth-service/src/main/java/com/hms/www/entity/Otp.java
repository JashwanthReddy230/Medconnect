package com.hms.www.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Stores only a HASH of the OTP — never the plaintext code — so even a DB
// leak doesn't expose usable codes. The plaintext code only ever exists
// in memory long enough to be hashed and printed to the server console.
@NoArgsConstructor
@AllArgsConstructor
@Data
@Table
@Entity
public class Otp {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	private String mobile;

	private String otpHash;

	private LocalDateTime createdAt;

	private LocalDateTime expiresAt;

	private boolean verified = false;

	private LocalDateTime verifiedAt;

	private int attempts = 0;
}
