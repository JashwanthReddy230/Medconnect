package com.hms.www.dto;


import jakarta.persistence.Column;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data

public class LoginRequest {
          
	@Column
	private String email; 
	@Column
	private String password; 
}
