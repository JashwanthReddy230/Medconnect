package com.hms.www.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class RegisterRequest {

	
    @NotNull(message = "Username cannot be null")
    @NotBlank(message = "Username cannot be null")
	private String fullName;
    
    @Email(message="Email should be valid")
	private String email;
    
    @NotBlank(message = "password should not be empty")
    @Size(min = 5, message = "password must be at least 5 digits long")
	private String password; 
    
    
   
    @Pattern(regexp = "^\\d{10}$", message="phone number should contain exactly 10 digits ")
    
	private String mobile; 
    
    @Pattern(
    	    regexp = "^(ADMIN|HOSPITAL|USER|DOCTOR)$",
    	    message = "Role must be ADMIN, HOSPITAL, USER, or DOCTOR"
    	)
    private String roleName; 

}
