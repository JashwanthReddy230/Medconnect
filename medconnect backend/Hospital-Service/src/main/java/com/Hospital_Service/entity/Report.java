package com.Hospital_Service.entity;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private LocalDate reportDate;

    // Null for the platform-wide Admin report; set to a Hospital's own id for a
    // report scoped to that hospital's own doctors, patients, appointments and bills.
    private Long hospitalId;

    private Long totalPatients;
    private Long totalDoctors;
    private Long totalAppointments;
    private Long totalBills;
    private Long totalPayments;
    private Double totalRevenue;
    private Double pendingRevenue;
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public LocalDate getReportDate() {
		return reportDate;
	}
	public void setReportDate(LocalDate reportDate) {
		this.reportDate = reportDate;
	}
	public Long getHospitalId() {
		return hospitalId;
	}
	public void setHospitalId(Long hospitalId) {
		this.hospitalId = hospitalId;
	}
	public Long getTotalPatients() {
		return totalPatients;
	}
	public void setTotalPatients(Long totalPatients) {
		this.totalPatients = totalPatients;
	}
	public Long getTotalDoctors() {
		return totalDoctors;
	}
	public void setTotalDoctors(Long totalDoctors) {
		this.totalDoctors = totalDoctors;
	}
	public Long getTotalAppointments() {
		return totalAppointments;
	}
	public void setTotalAppointments(Long totalAppointments) {
		this.totalAppointments = totalAppointments;
	}
	public Long getTotalBills() {
		return totalBills;
	}
	public void setTotalBills(Long totalBills) {
		this.totalBills = totalBills;
	}
	public Long getTotalPayments() {
		return totalPayments;
	}
	public void setTotalPayments(Long totalPayments) {
		this.totalPayments = totalPayments;
	}
	public Double getTotalRevenue() {
		return totalRevenue;
	}
	public void setTotalRevenue(Double totalRevenue) {
		this.totalRevenue = totalRevenue;
	}
	public Double getPendingRevenue() {
		return pendingRevenue;
	}
	public void setPendingRevenue(Double pendingRevenue) {
		this.pendingRevenue = pendingRevenue;
	}
    
}