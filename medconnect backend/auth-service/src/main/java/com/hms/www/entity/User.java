package com.hms.www.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Table
@Entity
public class User {

	@Id
	 @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column
	private String fullName;
	
	@Column(unique=true)
	private String email;
	
	@Column
	private String password;
	
	@Column
	private String mobile;
	
	@ManyToOne
	@JoinColumn(name="role_id")
	private Role role;

	public void setEnabled(boolean b) {
		// TODO Auto-generated method stub
		
	}

	

}
