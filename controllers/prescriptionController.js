import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js"; // required for populate()
import PDFDocument from "pdfkit";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

// @desc    Get prescriptions (role-scoped)
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Doctor") query.doctorId = req.user._id;
    if (req.user.role === "Patient") query.patientId = req.user._id;

    const prescriptions = await Prescription.find(query)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname email")
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single prescription
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname email");

    if (!prescription)
      return res.status(404).json({ message: "Prescription not found" });
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Doctor
export const createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, instructions } = req.body;

    const prescription = await Prescription.create({
      patientId,
      doctorId: req.user._id,
      medicines,
      instructions,
    });

    // Auto-generate PDF in background
    generateAndSavePDF(prescription._id);

    const populated = await prescription.populate([
      { path: "patientId", select: "name age gender" },
      { path: "doctorId", select: "fullname email" },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate PDF for a prescription and save Cloudinary URL
// @route   POST /api/prescriptions/:id/generate-pdf
// @access  Doctor
export const generatePrescriptionPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname email");

    if (!prescription)
      return res.status(404).json({ message: "Prescription not found" });

    const pdfUrl = await generateAndSavePDF(prescription._id, prescription);
    res.json({ message: "PDF generated successfully", pdfUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Helper: Build PDF and upload to Cloudinary ───────────────────────────────

async function generateAndSavePDF(prescriptionId, prescription) {
  try {
    if (!prescription) {
      prescription = await Prescription.findById(prescriptionId)
        .populate("patientId", "name age gender contact")
        .populate("doctorId", "fullname email");
    }

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // ── PDF Content ──────────────────────────────────────────────────────────

    // Header bar
    doc.rect(0, 0, 612, 80).fill("#0d9488");
    doc
      .fillColor("white")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("MedClinic AI", 50, 22);
    doc
      .fontSize(11)
      .font("Helvetica")
      .text("AI-Powered Clinic Management Platform", 50, 50);

    doc.moveDown(3);
    doc.fillColor("#0f172a");

    // Title
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("Medical Prescription", { align: "center" });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#0d9488");
    doc.moveDown(1);

    // Doctor & Patient info
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("Doctor Information", { underline: false });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Name: ${prescription.doctorId?.fullname || "N/A"}`)
      .text(`Email: ${prescription.doctorId?.email || "N/A"}`);
    doc.moveDown(0.8);

    doc.fontSize(11).font("Helvetica-Bold").text("Patient Information");
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Name: ${prescription.patientId?.name || "N/A"}`)
      .text(`Age: ${prescription.patientId?.age || "N/A"}`)
      .text(`Gender: ${prescription.patientId?.gender || "N/A"}`)
      .text(`Contact: ${prescription.patientId?.contact || "N/A"}`);
    doc.moveDown(0.8);

    doc.fontSize(11).font("Helvetica-Bold").text("Date Issued");
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        new Date(prescription.createdAt).toLocaleDateString("en-US", {
          dateStyle: "long",
        }),
      );
    doc.moveDown(1);

    // Medicines
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#e2e8f0");
    doc.moveDown(0.5);
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .fillColor("#0d9488")
      .text("Prescribed Medicines");
    doc.fillColor("#0f172a");
    doc.moveDown(0.3);

    (prescription.medicines || []).forEach((med, i) => {
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`${i + 1}. ${med.name || med}`);
      if (med.dosage)
        doc.fontSize(10).font("Helvetica").text(`   Dosage: ${med.dosage}`);
      if (med.frequency)
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`   Frequency: ${med.frequency}`);
      if (med.duration)
        doc.fontSize(10).font("Helvetica").text(`   Duration: ${med.duration}`);
      doc.moveDown(0.4);
    });

    // Instructions
    if (prescription.instructions) {
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#e2e8f0");
      doc.moveDown(0.5);
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#0d9488")
        .text("Instructions");
      doc
        .fillColor("#0f172a")
        .fontSize(10)
        .font("Helvetica")
        .text(prescription.instructions);
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("#94a3b8")
      .text("Generated by MedClinic AI — Secure Digital Health Management", {
        align: "center",
      });

    doc.end();

    // Convert chunks to buffer
    const pdfBuffer = await new Promise((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "prescriptions", format: "pdf", resource_type: "raw" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      Readable.from(pdfBuffer).pipe(stream);
    });

    // Save URL in DB
    await Prescription.findByIdAndUpdate(prescriptionId, {
      pdfUrl: uploadResult.secure_url,
    });

    return uploadResult.secure_url;
  } catch (err) {
    console.error("PDF generation failed:", err.message);
    return null;
  }
}
