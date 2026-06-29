const express  = require('express');
const ExcelJS  = require('exceljs');
const PDFDocument = require('pdfkit');
const pool     = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

const EMPRESA = {
  nombre: 'MAHJOUB KOUIRA S.L',
  cif: 'B72564354',
  convenio: 'Convenio Colectivo de la Construcción y Montaje — Catalunya',
  jornada_max_dia: 8,   // horas máximas por día según convenio
  jornada_semanal: 40,  // horas semanales
};

async function getDatosMes(usuario_id, mes) {
  const usuRes = await pool.query(
      'SELECT nombre, username FROM usuarios WHERE id = $1', [usuario_id]
  );
  if (!usuRes.rows.length) throw new Error('Trabajador no encontrado');
  const trabajador = usuRes.rows[0];

  const ficRes = await pool.query(
      `SELECT DATE(fecha_hora)::text AS dia, tipo, TO_CHAR(fecha_hora, 'HH24:MI:SS') AS hora
       FROM fichajes
       WHERE usuario_id = $1 AND TO_CHAR(fecha_hora, 'YYYY-MM') = $2
       ORDER BY fecha_hora ASC`,
      [usuario_id, mes]
  );

  const porDia = {};
  for (const f of ficRes.rows) {
    if (!porDia[f.dia]) porDia[f.dia] = { entrada: null, salida: null };
    if (f.tipo === 'entrada' && !porDia[f.dia].entrada) porDia[f.dia].entrada = f.hora;
    if (f.tipo === 'salida') porDia[f.dia].salida = f.hora;
  }

  const [anyo, numMes] = mes.split('-').map(Number);
  const diasEnMes = new Date(anyo, numMes, 0).getDate();
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const filas = [];
  let totalMinutos = 0;
  let totalMinutosExtra = 0;

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = `${mes}-${String(d).padStart(2, '0')}`;
    const fecha    = new Date(anyo, numMes - 1, d);
    const diaSem   = diasSemana[fecha.getDay()];
    const esFinSem = fecha.getDay() === 0 || fecha.getDay() === 6;
    const registro = porDia[fechaStr];
    const entrada  = registro?.entrada?.slice(0, 5) || '';
    const salida   = registro?.salida?.slice(0, 5)  || '';
    let horasTxt   = '';
    let extraTxt   = '';
    let mins       = 0;
    let minsExtra  = 0;
    let esExtra    = false;

    if (entrada && salida) {
      const [eh, em] = entrada.split(':').map(Number);
      const [sh, sm] = salida.split(':').map(Number);
      mins = (sh * 60 + sm) - (eh * 60 + em);
      if (mins > 0) {
        totalMinutos += mins;
        horasTxt = `${Math.floor(mins/60)}h ${mins%60}m`;
        // Horas extra si supera 8h en día laboral
        if (!esFinSem && mins > EMPRESA.jornada_max_dia * 60) {
          minsExtra = mins - EMPRESA.jornada_max_dia * 60;
          totalMinutosExtra += minsExtra;
          extraTxt = `+${Math.floor(minsExtra/60)}h ${minsExtra%60}m`;
          esExtra = true;
        }
      }
    }

    filas.push({ fechaStr, diaSem, entrada, salida, horasTxt, extraTxt, esFinSem, mins, minsExtra, esExtra });
  }

  return { trabajador, filas, totalMinutos, totalMinutosExtra, anyo, numMes };
}

// ── GET /api/exportar/excel ──────────────────────────────────────────────────
router.get('/excel', verificarToken, soloAdmin, async (req, res) => {
  const { usuario_id, mes } = req.query;
  if (!usuario_id || !mes) return res.status(400).json({ error: 'Faltan parámetros' });

  try {
    const { trabajador, filas, totalMinutos, totalMinutosExtra } = await getDatosMes(usuario_id, mes);

    const workbook = new ExcelJS.Workbook();
    const hoja     = workbook.addWorksheet('Fichajes');

    // Cabecera empresa
    hoja.mergeCells('A1:F1');
    hoja.getCell('A1').value = `${EMPRESA.nombre} — CIF: ${EMPRESA.cif}`;
    hoja.getCell('A1').font  = { bold: true, size: 13 };

    hoja.mergeCells('A2:F2');
    hoja.getCell('A2').value = EMPRESA.convenio;
    hoja.getCell('A2').font  = { size: 9, italic: true, color: { argb: 'FF777777' } };

    hoja.mergeCells('A3:F3');
    hoja.getCell('A3').value = `Trabajador: ${trabajador.nombre}  |  Mes: ${mes}`;
    hoja.getCell('A3').font  = { size: 11, color: { argb: 'FF555555' } };
    hoja.addRow([]);

    const cab = hoja.addRow(['Fecha', 'Día', 'Entrada', 'Salida', 'Horas trabajadas', 'Horas extra']);
    cab.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF185FA5' } };
      cell.alignment = { horizontal: 'center' };
    });

    hoja.getColumn(1).width = 14;
    hoja.getColumn(2).width = 13;
    hoja.getColumn(3).width = 12;
    hoja.getColumn(4).width = 12;
    hoja.getColumn(5).width = 18;
    hoja.getColumn(6).width = 14;

    for (const f of filas) {
      const fila = hoja.addRow([f.fechaStr, f.diaSem, f.entrada, f.salida, f.horasTxt, f.extraTxt]);
      let color = f.esFinSem ? 'FFF0F0F0' : (!f.entrada ? 'FFFFF3CD' : 'FFEBF8F2');
      if (f.esExtra) color = 'FFFFF3CD'; // amarillo si hay horas extra
      fila.eachCell((cell, col) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.alignment = { horizontal: 'center' };
        if (f.esFinSem) cell.font = { color: { argb: 'FF999999' } };
        if (col === 6 && f.esExtra) cell.font = { bold: true, color: { argb: 'FFCC6600' } };
      });
    }

    hoja.addRow([]);
    const tot = hoja.addRow(['', '', '', 'TOTAL HORAS:', `${Math.floor(totalMinutos/60)}h ${totalMinutos%60}m`, `${Math.floor(totalMinutosExtra/60)}h ${totalMinutosExtra%60}m extra`]);
    tot.getCell(4).font = { bold: true };
    tot.getCell(5).font = { bold: true, color: { argb: 'FF185FA5' } };
    tot.getCell(6).font = { bold: true, color: { argb: 'FFCC6600' } };

    hoja.addRow([]);
    // Firma
    hoja.addRow(['Firma trabajador:', '', '', '', 'Firma empresa:', '']);
    hoja.addRow(['', '', '', '', '', '']);
    hoja.addRow(['___________________', '', '', '', '___________________', '']);

    hoja.addRow([]);
    const nota = hoja.addRow([`Documento generado conforme al RD-Ley 8/2019. ${EMPRESA.convenio}. Jornada máxima: ${EMPRESA.jornada_max_dia}h/día, ${EMPRESA.jornada_semanal}h/semana.`]);
    hoja.mergeCells(`A${nota.number}:F${nota.number}`);
    nota.getCell(1).font = { italic: true, size: 8, color: { argb: 'FF888888' } };

    const nombreArchivo = `fichajes_${trabajador.nombre.replace(/ /g,'_')}_${mes}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el Excel' });
  }
});

// ── GET /api/exportar/pdf ────────────────────────────────────────────────────
router.get('/pdf', verificarToken, soloAdmin, async (req, res) => {
  const { usuario_id, mes } = req.query;
  if (!usuario_id || !mes) return res.status(400).json({ error: 'Faltan parámetros' });

  try {
    const { trabajador, filas, totalMinutos, totalMinutosExtra, anyo, numMes } = await getDatosMes(usuario_id, mes);
    const nombreMes = new Date(anyo, numMes - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const nombreArchivo = `fichajes_${trabajador.nombre.replace(/ /g,'_')}_${mes}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    doc.pipe(res);

    // Cabecera empresa
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1a1a1a').text(EMPRESA.nombre, 40, 40);
    doc.fontSize(9).font('Helvetica').fillColor('#555555').text(`CIF: ${EMPRESA.cif}`, 40, 58);
    doc.fontSize(8).fillColor('#777777').text(EMPRESA.convenio, 40, 70);

    // Línea separadora
    doc.moveTo(40, 84).lineTo(555, 84).strokeColor('#185FA5').lineWidth(1.5).stroke();

    // Info trabajador
    doc.roundedRect(40, 92, 515, 44, 6).fillAndStroke('#EBF4FF', '#185FA5');
    doc.fillColor('#185FA5').font('Helvetica-Bold').fontSize(10).text('Trabajador:', 54, 103);
    doc.fillColor('#1a1a1a').font('Helvetica').text(trabajador.nombre, 130, 103);
    doc.fillColor('#185FA5').font('Helvetica-Bold').text('Mes:', 330, 103);
    doc.fillColor('#1a1a1a').font('Helvetica').text(nombreMes, 365, 103);
    doc.fillColor('#555555').fontSize(8).text(`Jornada convenio: ${EMPRESA.jornada_max_dia}h/día · ${EMPRESA.jornada_semanal}h/semana`, 54, 118);

    // Cabecera tabla
    const colX  = [40, 125, 220, 305, 385, 470];
    const colW  = [80, 90, 80, 80, 80, 85];
    const heads = ['Fecha', 'Día', 'Entrada', 'Salida', 'Horas', 'H. Extra'];
    let y = 152;

    doc.rect(40, y, 515, 18).fill('#185FA5');
    heads.forEach((h, i) => {
      doc.fillColor('white').font('Helvetica-Bold').fontSize(8.5)
          .text(h, colX[i] + 2, y + 5, { width: colW[i], align: 'center' });
    });
    y += 18;

    for (const f of filas) {
      if (y > 750) { doc.addPage(); y = 40; }

      const bg = f.esFinSem ? '#F5F5F5' : (f.esExtra ? '#FFF8E1' : (!f.entrada ? '#FFFBEA' : '#F0FBF5'));
      doc.rect(40, y, 515, 15).fill(bg);

      const vals = [f.fechaStr, f.diaSem, f.entrada, f.salida, f.horasTxt, f.extraTxt];
      vals.forEach((v, i) => {
        const color = f.esFinSem ? '#999999' : (i === 5 && f.esExtra ? '#CC6600' : '#1a1a1a');
        const bold  = i === 5 && f.esExtra;
        doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8)
            .text(v, colX[i] + 2, y + 4, { width: colW[i], align: 'center' });
      });

      doc.moveTo(40, y + 15).lineTo(555, y + 15).strokeColor('#EEEEEE').lineWidth(0.4).stroke();
      y += 15;
    }

    // Totales
    y += 8;
    doc.rect(40, y, 515, 22).fill('#EBF4FF');
    doc.fillColor('#185FA5').font('Helvetica-Bold').fontSize(9)
        .text(`TOTAL HORAS: ${Math.floor(totalMinutos/60)}h ${totalMinutos%60}m`, 40, y + 7, { width: 260, align: 'center' });
    doc.fillColor('#CC6600').font('Helvetica-Bold').fontSize(9)
        .text(`HORAS EXTRA: ${Math.floor(totalMinutosExtra/60)}h ${totalMinutosExtra%60}m`, 300, y + 7, { width: 255, align: 'center' });
    y += 32;

    // Firmas
    y += 16;
    doc.moveTo(40, y).lineTo(220, y).strokeColor('#AAAAAA').lineWidth(0.5).stroke();
    doc.moveTo(335, y).lineTo(555, y).stroke();
    doc.fillColor('#555555').font('Helvetica').fontSize(8)
        .text('Firma y DNI del trabajador', 40, y + 5, { width: 180, align: 'center' })
        .text('Firma y sello de la empresa', 335, y + 5, { width: 220, align: 'center' });

    // Pie legal
    doc.fillColor('#AAAAAA').fontSize(6.5)
        .text(`Documento generado conforme al Real Decreto-Ley 8/2019 sobre registro de jornada. ${EMPRESA.convenio}. CIF: ${EMPRESA.cif}. Los registros deben conservarse 4 años.`,
            40, 818, { align: 'center', width: 515 });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

module.exports = router;