package com.Hospital_Service.Dto;

public class DoctorResponse {

	

	    private Long id;

	    private String doctorName;

	    private String specialization;

	    private Double consultationFee;

	    private String status;

	    private Long hospitalId;

	    private String qualification;

	    private Integer experience;

	    private String email;

	    private String mobile;

	    public Long getId() {
	        return id;
	    }

	    public void setId(Long id) {
	        this.id = id;
	    }

	    public String getDoctorName() {
	        return doctorName;
	    }

	    public void setDoctorName(String doctorName) {
	        this.doctorName = doctorName;
	    }

	    public String getSpecialization() {
	        return specialization;
	    }

	    public void setSpecialization(String specialization) {
	        this.specialization = specialization;
	    }

	    public Double getConsultationFee() {
	        return consultationFee;
	    }

	    public void setConsultationFee(Double consultationFee) {
	        this.consultationFee = consultationFee;
	    }

	    public String getStatus() {
	        return status;
	    }

	    public void setStatus(String status) {
	        this.status = status;
	    }

	    public Long getHospitalId() {
	        return hospitalId;
	    }

	    public void setHospitalId(Long hospitalId) {
	        this.hospitalId = hospitalId;
	    }

	    public String getQualification() {
	        return qualification;
	    }

	    public void setQualification(String qualification) {
	        this.qualification = qualification;
	    }

	    public Integer getExperience() {
	        return experience;
	    }

	    public void setExperience(Integer experience) {
	        this.experience = experience;
	    }

	    public String getEmail() {
	        return email;
	    }

	    public void setEmail(String email) {
	        this.email = email;
	    }

	    public String getMobile() {
	        return mobile;
	    }

	    public void setMobile(String mobile) {
	        this.mobile = mobile;
	    }
}
