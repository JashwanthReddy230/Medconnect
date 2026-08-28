package com.Hospital_Service.Dto;



	public class BillRequest {

	    private Long appointmentId;
	    private Long patientId;
	    private Long doctorId;
	    private Double consultationFee;
	    private Double medicineFee;
	    private Double laboratoryFee;
	    private Double discount;

	    public Long getAppointmentId() {
	        return appointmentId;
	    }

	    public void setAppointmentId(Long appointmentId) {
	        this.appointmentId = appointmentId;
	    }

	    public Long getPatientId() {
	        return patientId;
	    }

	    public void setPatientId(Long patientId) {
	        this.patientId = patientId;
	    }

	    public Long getDoctorId() {
	        return doctorId;
	    }

	    public void setDoctorId(Long doctorId) {
	        this.doctorId = doctorId;
	    }

	    public Double getConsultationFee() {
	        return consultationFee;
	    }

	    public void setConsultationFee(Double consultationFee) {
	        this.consultationFee = consultationFee;
	    }

	    public Double getMedicineFee() {
	        return medicineFee;
	    }

	    public void setMedicineFee(Double medicineFee) {
	        this.medicineFee = medicineFee;
	    }

	    public Double getLaboratoryFee() {
	        return laboratoryFee;
	    }

	    public void setLaboratoryFee(Double laboratoryFee) {
	        this.laboratoryFee = laboratoryFee;
	    }

	    public Double getDiscount() {
	        return discount;
	    }

	    public void setDiscount(Double discount) {
	        this.discount = discount;
	    }
	
}
