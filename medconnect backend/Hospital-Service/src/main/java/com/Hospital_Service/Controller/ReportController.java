package com.Hospital_Service.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.Hospital_Service.Dto.ReportResponse;
import com.Hospital_Service.Service.ReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService service;

    // ── Admin: platform-wide report across ALL hospitals/doctors/patients ─────
    // Computes fresh figures from the DB and (re)persists today's global snapshot.
    @GetMapping("/hospital")
    public ResponseEntity<ReportResponse> getHospitalReport() {
        return ResponseEntity.ok(service.getHospitalReport());
    }

    @GetMapping("/latest")
    public ResponseEntity<ReportResponse> getLatestReport() {
        return ResponseEntity.ok(service.getLatestReport());
    }

    @GetMapping("/all")
    public ResponseEntity<List<ReportResponse>> getAllReports() {
        return ResponseEntity.ok(service.getAllReports());
    }

    // ── Hospital: scoped to ONE hospital's own doctors/patients/appointments ──
    // Computes fresh figures scoped to this hospital and (re)persists today's
    // snapshot for it (hospitalId is stored on the Report row).
    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<ReportResponse> getHospitalScopedReport(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(service.getHospitalScopedReport(hospitalId));
    }

    @GetMapping("/hospital/{hospitalId}/latest")
    public ResponseEntity<ReportResponse> getLatestHospitalReport(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(service.getLatestHospitalReport(hospitalId));
    }

    @GetMapping("/hospital/{hospitalId}/all")
    public ResponseEntity<List<ReportResponse>> getAllHospitalReports(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(service.getAllHospitalReports(hospitalId));
    }
}