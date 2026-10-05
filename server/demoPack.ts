import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';

export interface SyntheticEvidenceItem {
  filename: string;
  buffer: Buffer;
  mime: string;
  type: 'FIR' | 'Witness Statement' | 'Forensic Report' | 'Charge Sheet' | 'Digital Evidence';
  confidentiality: 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET';
  title: string;
}

async function buildPdfDocument(title: string, subtitle: string, sections: { heading: string; body: string[] }[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width, height } = page.getSize();

  // Header banner
  page.drawRectangle({
    x: 40,
    y: height - 80,
    width: width - 80,
    height: 45,
    color: rgb(0.08, 0.13, 0.24), // #14213D Navy
  });

  page.drawText('GOVERNMENT OF NCT OF DELHI • DELHI POLICE INVESTIGATION RECORD', {
    x: 55,
    y: height - 55,
    size: 9,
    font: boldFont,
    color: rgb(0.98, 0.64, 0.07), // Gold/Amber
  });

  page.drawText(title, {
    x: 55,
    y: height - 72,
    size: 13,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  let currentY = height - 105;

  page.drawText(subtitle, {
    x: 40,
    y: currentY,
    size: 10,
    font: regularFont,
    color: rgb(0.3, 0.35, 0.4),
  });

  currentY -= 20;

  // Thin separator rule
  page.drawLine({
    start: { x: 40, y: currentY },
    end: { x: width - 40, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.88, 0.92),
  });

  currentY -= 25;

  for (const sec of sections) {
    page.drawText(sec.heading, {
      x: 40,
      y: currentY,
      size: 11,
      font: boldFont,
      color: rgb(0.08, 0.13, 0.24),
    });

    currentY -= 16;

    for (const line of sec.body) {
      if (currentY < 60) break;
      page.drawText(line, {
        x: 45,
        y: currentY,
        size: 9.5,
        font: regularFont,
        color: rgb(0.2, 0.23, 0.28),
      });
      currentY -= 14;
    }

    currentY -= 12;
  }

  // Footer seal notice
  page.drawRectangle({
    x: 40,
    y: 30,
    width: width - 80,
    height: 25,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page.drawText('PROTOTYPE SYNTHETIC LEGAL RECORD • SECTION 63 BSA 2023 TAMPER-EVIDENT ARCHIVAL FORMAT', {
    x: 50,
    y: 39,
    size: 7.5,
    font: boldFont,
    color: rgb(0.4, 0.45, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Builds the 5 synthetic evidence items:
 * 1. FIR (with fictional victim Meera Kulkarni)
 * 2. Witness Statement
 * 3. Forensic Examination Report
 * 4. Police Charge Sheet
 * 5. 3 MB placeholder evidence video
 */
export async function generateDemoPackItems(): Promise<SyntheticEvidenceItem[]> {
  // 1. FIR
  const firBuffer = await buildPdfDocument(
    'FIRST INFORMATION REPORT (Under Section 173 BNSS 2023)',
    'Police Station: Mayur Vihar PS • FIR No: FIR-0891/2024/ND • Date: 16-Aug-2024',
    [
      {
        heading: '1. INCIDENT & COMPLAINANT PARTICULARS',
        body: [
          'FIR Registration No: FIR-0891/2024/ND',
          'Date & Hour of Occurrence: 14-Aug-2024 at approx 22:30 IST',
          'Complainant / Victim Name: Meera Kulkarni (Protected Entity under Victim Protection Scheme)',
          'Residence / Jurisdiction: Mayur Vihar Phase-II, East District, New Delhi',
          'Investigating Officer: Inspector Vikram Rathore (Officer ID: IO-7842)',
        ],
      },
      {
        heading: '2. STATUTORY LEGAL PROVISIONS',
        body: [
          'Sections: Bharatiya Nyaya Sanhita (BNS) Section 308 (Extortion)',
          'Information Technology Act 2000, Section 66D (Cheating by Impersonation via Computer)',
          'Cognizable / Non-Bailable Offence docket registered for special investigation.',
        ],
      },
      {
        heading: '3. COMPLAINT DETAILS & STATEMENT OF VICTIM MEERA KULKARNI',
        body: [
          'The victim Meera Kulkarni reported receiving extortion demands demanding transfer',
          'of digital funds accompanied by threats of publishing tampered surveillance photos.',
          'Victim Meera Kulkarni submitted initial encrypted email headers and server access tokens.',
          'Victim requests non-disclosure of personal identity to public registries.',
        ],
      },
      {
        heading: '4. INVESTIGATION DISPATCH',
        body: [
          'Evidence seized: Digital communications docket, gateway logs, device hash dumps.',
          'Referred to Central Forensic Science Laboratory (CFSL) for SHA-256 binary validation.',
        ],
      },
    ]
  );

  // 2. Witness Statement
  const witnessBuffer = await buildPdfDocument(
    'STATEMENT OF WITNESS (Under Section 180 BNSS 2023)',
    'Witness Examination Docket • Investigating Officer: Inspector Vikram Rathore',
    [
      {
        heading: '1. WITNESS CREDENTIALS',
        body: [
          'Name of Witness: Rajesh S. Pathak',
          'Occupation: Senior Infrastructure & Systems Security Administrator',
          'Workplace: CloudGate Hosting Solutions, Okhla Industrial Area, New Delhi',
          'Identity Verification: Aadhar Token Verified (XXXX-XXXX-9912)',
        ],
      },
      {
        heading: '2. DEPOSITION CONCERNING TARGET VICTIM MEERA KULKARNI',
        body: [
          'I was on duty on 14-Aug-2024 when abnormal intrusion alerts flagged an unauthorized login.',
          'The intrusion originated from a foreign VPN endpoint targeting accounts associated with Meera Kulkarni.',
          'I witnessed the malicious session downloading confidential directories of Meera Kulkarni.',
          'I immediately generated forensic memory snapshots and preserved all IP session handshakes.',
        ],
      },
      {
        heading: '3. CERTIFICATION & ELECTRONIC ENDORSEMENT',
        body: [
          'Statement recorded digitally in the presence of two independent panchas.',
          'Affirmed on oath as true and correct reflection of the log preservation protocol.',
        ],
      },
    ]
  );

  // 3. Forensic Report
  const forensicBuffer = await buildPdfDocument(
    'CENTRAL FORENSIC SCIENCE LABORATORY (CFSL) REPORT',
    'Division of Digital Forensics & Cyber Intelligence • Lab Reference: CFSL-DF-2024-889',
    [
      {
        heading: '1. EXAMINATION REQUEST & LABELS',
        body: [
          'Forwarding Agency: Delhi Police, Mayur Vihar PS (Case FIR-0891/2024/ND)',
          'Examiner / Scientist: Dr. Ananya Sharma (Senior Forensic Scientist, FA-9104)',
          'Exhibits Received: 1x NVMe Solid State Drive (Sealed Packet labeled Exhibit-E1)',
        ],
      },
      {
        heading: '2. FORENSIC CLONING & HASH VERIFICATION',
        body: [
          'Physical Integrity: Evidence bag seals verified intact and uncompromised.',
          'Bit-stream Image created using write-blocker hardware Tableau T8u.',
          'Master Image SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
          'Verification Hash match: 100% Bit-for-bit exact copy verified.',
        ],
      },
      {
        heading: '3. SCIENTIFIC FINDINGS & VICTIM TARGET ANALYSIS',
        body: [
          'Forensic carving recovered 14 extortion draft drafts addressed to Meera Kulkarni.',
          'Malicious keylogger payload confirmed installed via spear-phishing PDF.',
          'No tampering observed in evidence custody timeline.',
        ],
      },
    ]
  );

  // 4. Charge Sheet
  const chargeSheetBuffer = await buildPdfDocument(
    'FINAL REPORT / CHARGE SHEET (Under Section 193 BNSS 2023)',
    'In the Court of Chief Metropolitan Magistrate, Patiala House Courts, New Delhi',
    [
      {
        heading: '1. DOCKET PARTICULARS',
        body: [
          'Police Station: Mayur Vihar PS • FIR No: FIR-0891/2024/ND',
          'Investigating Officer: Inspector Vikram Rathore (IO-7842)',
          'Date of Charge Sheet Submission: 28-Sep-2024',
          'Status of Accused: Accused No. 1 Arrested; Accused No. 2 Absconding.',
        ],
      },
      {
        heading: '2. SUMMARY OF INVESTIGATION & CHARGES',
        body: [
          'Investigation proves organized digital extortion and harassment targeted against Meera Kulkarni.',
          'Chain of custody of digital evidence maintained under Section 63 BSA 2023 standards.',
          'Original cryptographic hashes deposited into immutable SAKSHYA OS vault.',
          'Redacted victim copy submitted to judicial registry to protect identity of Meera Kulkarni.',
        ],
      },
    ]
  );

  // 5. 3 MB placeholder "evidence video" file (Valid MP4 container header + simulated binary video stream)
  const videoSize = 3 * 1024 * 1024; // 3 MB
  const videoBuffer = Buffer.alloc(videoSize);

  // Standard MP4 ftyp box header (4 bytes size 0x20, 'ftyp', 'mp42', minor 0, compatible brands)
  videoBuffer.writeUInt32BE(0x00000020, 0); // box size 32
  videoBuffer.write('ftyp', 4, 'ascii');
  videoBuffer.write('mp42', 8, 'ascii');
  videoBuffer.writeUInt32BE(0x00000000, 12);
  videoBuffer.write('isommp42', 16, 'ascii');
  // mdat box header (raw media payload)
  videoBuffer.writeUInt32BE(videoSize - 32, 32);
  videoBuffer.write('mdat', 36, 'ascii');

  // Fill video payload with deterministic pseudo-random binary data
  const chunkFill = crypto.createHash('sha256').update('SAKSHYA_SYNTHETIC_CCTV_STREAM_DATA').digest();
  for (let offset = 40; offset < videoSize; offset += 32) {
    chunkFill.copy(videoBuffer, offset, 0, Math.min(32, videoSize - offset));
  }

  return [
    {
      filename: 'FIR_0891_2024_Cyber_Extortion.pdf',
      buffer: firBuffer,
      mime: 'application/pdf',
      type: 'FIR',
      confidentiality: 'CONFIDENTIAL',
      title: 'FIR-0891/2024/ND: Cyber Extortion & Intimidation',
    },
    {
      filename: 'Witness_Statement_Rajesh_Pathak.pdf',
      buffer: witnessBuffer,
      mime: 'application/pdf',
      type: 'Witness Statement',
      confidentiality: 'RESTRICTED',
      title: 'Witness Statement - Rajesh S. Pathak (Sec 180 BNSS)',
    },
    {
      filename: 'CFSL_Forensic_Examination_Report_889.pdf',
      buffer: forensicBuffer,
      mime: 'application/pdf',
      type: 'Forensic Report',
      confidentiality: 'CONFIDENTIAL',
      title: 'CFSL Digital Forensics Examination Report #889',
    },
    {
      filename: 'ChargeSheet_FIR_0891_Patiala_House.pdf',
      buffer: chargeSheetBuffer,
      mime: 'application/pdf',
      type: 'Charge Sheet',
      confidentiality: 'RESTRICTED',
      title: 'Final Police Report / Charge Sheet under Sec 193 BNSS',
    },
    {
      filename: 'CCTV_Exhibit_E4_Camera_MayurVihar.mp4',
      buffer: videoBuffer,
      mime: 'video/mp4',
      type: 'Digital Evidence',
      confidentiality: 'CONFIDENTIAL',
      title: 'CCTV Surveillance Capture Exhibit-E4 (3 MB)',
    },
  ];
}
