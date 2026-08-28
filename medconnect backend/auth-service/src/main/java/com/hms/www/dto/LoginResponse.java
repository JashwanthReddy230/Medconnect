package com.hms.www.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class LoginResponse {
	
	private Long userId; 
	private String name; 
	private String role;
    private String token;
}
