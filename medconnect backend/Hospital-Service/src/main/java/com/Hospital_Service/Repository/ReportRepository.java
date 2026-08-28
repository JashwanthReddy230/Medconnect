package com.Hospital_Service.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.Hospital_Service.entity.Report;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // ── Admin (platform-wide) snapshots — hospitalId is NULL ──────────────────
    Optional<Report> findFirstByHospitalIdIsNullAndReportDateOrderByIdDesc(LocalDate reportDate);

    Optional<Report> findFirstByHospitalIdIsNullOrderByReportDateDescIdDesc();

    List<Report> findAllByHospitalIdIsNullOrderByReportDateDescIdDesc();

    // ── Hospital-scoped snapshots — hospitalId = a specific Hospital's own id ─
    Optional<Report> findFirstByHospitalIdAndReportDateOrderByIdDesc(Long hospitalId, LocalDate reportDate);

    Optional<Report> findFirstByHospitalIdOrderByReportDateDescIdDesc(Long hospitalId);

    List<Report> findAllByHospitalIdOrderByReportDateDescIdDesc(Long hospitalId);

}