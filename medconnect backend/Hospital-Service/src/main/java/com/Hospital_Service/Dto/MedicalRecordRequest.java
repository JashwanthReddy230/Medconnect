package com.Hospital_Service.Dto;

import java.time.LocalDate;

public class MedicalRecordRequest {

    private Long appointmentId;
    private Long patientId;
    private Long doctorId;
    private String diagnosis;
    private String symptoms;
    private String treatment;
    private String doctorNotes;
    private LocalDate visitDate;
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
	public String getDiagnosis() {
		return diagnosis;
	}
	public void setDiagnosis(String diagnosis) {
		this.diagnosis = diagnosis;
	}
	public String getSymptoms() {
		return symptoms;
	}
	public void setSymptoms(String symptoms) {
		this.symptoms = symptoms;
	}
	public String getTreatment() {
		return treatment;
	}
	public void setTreatment(String treatment) {
		this.treatment = treatment;
	}
	public String getDoctorNotes() {
		return doctorNotes;
	}
	public void setDoctorNotes(String doctorNotes) {
		this.doctorNotes = doctorNotes;
	}
	public LocalDate getVisitDate() {
		return visitDate;
	}
	public void setVisitDate(LocalDate visitDate) {
		this.visitDate = visitDate;
	}
    
}
