const express  = require('express');
const ExcelJS  = require('exceljs');
const PDFDocument = require('pdfkit');
const pool     = require('../db/connection');
const { verificarToken, soloAdmin } = require('../middleware/auth');

const router = express.Router();

// Función compartida para obtener datos del trabajador y sus fichajes del mes
async function getDatosMes(usuario_id, mes) {
  const usuRes = await pool.query(
    'SELECT nombre, username FROM usuarios WHERE id = $1',
    [usuario_id]
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

  // Organizar por día
  const porDia = {};
  for (const f of ficRes.rows) {
    if (!porDia[f.dia]) porDia[f.dia] = { entrada: null, salida: null };
    if (f.tipo === 'entrada' && !porDia[f.dia].entrada) porDia[f.dia].entrada = f.hora;
    if (f.tipo === 'salida') porDia[f.dia].salida = f.hora;
  }

  // Generar filas del mes
  const [anyo, numMes] = mes.split('-').map(Number);
  const diasEnMes = new Date(anyo, numMes, 0).getDate();
  const diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const filas = [];
  let totalMinutos = 0;

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = `${mes}-${String(d).padStart(2, '0')}`;
    const fecha    = new Date(anyo, numMes - 1, d);
    const diaSem   = diasSemana[fecha.getDay()];
    const esFinSem = fecha.getDay() === 0 || fecha.getDay() === 6;
    const registro = porDia[fechaStr];
    const entrada  = registro?.entrada?.slice(0, 5) || '';
    const salida   = registro?.salida?.slice(0, 5)  || '';
    let horasTxt   = '';
    let mins       = 0;

    if (entrada && salida) {
      const [eh, em] = entrada.split(':').map(Number);
      const [sh, sm] = salida.split(':').map(Number);
      mins = (sh * 60 + sm) - (eh * 60 + em);
      if (mins > 0) { totalMinutos += mins; horasTxt = `${Math.floor(mins/60)}h ${mins%60}m`; }
    }

    filas.push({ fechaStr, diaSem, entrada, salida, horasTxt, esFinSem, mins });
  }

  return { trabajador, filas, totalMinutos, anyo, numMes };
}

// ── GET /api/exportar/excel ──────────────────────────────────────────────────
router.get('/excel', verificarToken, soloAdmin, async (req, res) => {
  const { usuario_id, mes } = req.query;
  if (!usuario_id || !mes) return res.status(400).json({ error: 'Faltan parámetros' });

  try {
    const { trabajador, filas, totalMinutos } = await getDatosMes(usuario_id, mes);

    const workbook = new ExcelJS.Workbook();
    const hoja     = workbook.addWorksheet('Fichajes');

    hoja.mergeCells('A1:E1');
    hoja.getCell('A1').value = 'MAHJOUB KOUIRA S.L — Registro de jornada laboral';
    hoja.getCell('A1').font  = { bold: true, size: 13 };

    hoja.mergeCells('A2:E2');
    hoja.getCell('A2').value = `Trabajador: ${trabajador.nombre}  |  Mes: ${mes}`;
    hoja.getCell('A2').font  = { size: 11, color: { argb: 'FF555555' } };
    hoja.addRow([]);

    const cab = hoja.addRow(['Fecha', 'Día semana', 'Entrada', 'Salida', 'Horas trabajadas']);
    cab.eachCell((cell) => {
      cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF185FA5' } };
      cell.alignment = { horizontal: 'center' };
    });

    hoja.getColumn(1).width = 14;
    hoja.getColumn(2).width = 14;
    hoja.getColumn(3).width = 12;
    hoja.getColumn(4).width = 12;
    hoja.getColumn(5).width = 18;

    for (const f of filas) {
      const fila  = hoja.addRow([f.fechaStr, f.diaSem, f.entrada, f.salida, f.horasTxt]);
      const color = f.esFinSem ? 'FFF0F0F0' : (!f.entrada ? 'FFFFF3CD' : 'FFEBF8F2');
      fila.eachCell((cell) => {
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.alignment = { horizontal: 'center' };
        if (f.esFinSem) cell.font = { color: { argb: 'FF999999' } };
      });
    }

    hoja.addRow([]);
    const tot = hoja.addRow(['', '', '', 'TOTAL HORAS:', `${Math.floor(totalMinutos/60)}h ${totalMinutos%60}m`]);
    tot.getCell(4).font = { bold: true };
    tot.getCell(5).font = { bold: true, color: { argb: 'FF185FA5' } };
    hoja.addRow([]);
    const nota = hoja.addRow(['Registro generado automáticamente conforme al RD-Ley 8/2019']);
    hoja.mergeCells(`A${nota.number}:E${nota.number}`);
    nota.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF888888' } };

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
    const { trabajador, filas, totalMinutos, anyo, numMes } = await getDatosMes(usuario_id, mes);
    const nombreMes = new Date(anyo, numMes - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const nombreArchivo = `fichajes_${trabajador.nombre.replace(/ /g,'_')}_${mes}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    doc.pipe(res);

    // Cabecera
    doc.fontSize(16).font('Helvetica-Bold').text('MAHJOUB KOUIRA S.L', 40, 40);
    doc.fontSize(10).font('Helvetica').fillColor('#555555').text('Registro de jornada laboral — RD-Ley 8/2019', 40, 62);

    // Caja info trabajador
    doc.roundedRect(40, 82, 515, 44, 6).fillAndStroke('#EBF4FF', '#185FA5');
    doc.fillColor('#185FA5').font('Helvetica-Bold').fontSize(11).text('Trabajador:', 54, 94);
    doc.fillColor('#1a1a1a').font('Helvetica').text(trabajador.nombre, 130, 94);
    doc.fillColor('#185FA5').font('Helvetica-Bold').text('Mes:', 330, 94);
    doc.fillColor('#1a1a1a').font('Helvetica').text(nombreMes, 360, 94);

    // Cabecera tabla
    const colX  = [40, 140, 240, 330, 420];
    const colW  = [95, 95, 85, 85, 95];
    const heads = ['Fecha', 'Día semana', 'Entrada', 'Salida', 'Horas'];
    let y = 145;

    doc.rect(40, y, 515, 20).fill('#185FA5');
    heads.forEach((h, i) => {
      doc.fillColor('white').font('Helvetica-Bold').fontSize(9)
         .text(h, colX[i] + 4, y + 6, { width: colW[i], align: 'center' });
    });
    y += 20;

    // Filas
    for (const f of filas) {
      if (y > 760) { doc.addPage(); y = 40; }

      const bg = f.esFinSem ? '#F5F5F5' : (!f.entrada ? '#FFFBEA' : '#F0FBF5');
      doc.rect(40, y, 515, 16).fill(bg);

      const vals = [f.fechaStr, f.diaSem, f.entrada, f.salida, f.horasTxt];
      const color = f.esFinSem ? '#999999' : '#1a1a1a';
      vals.forEach((v, i) => {
        doc.fillColor(color).font('Helvetica').fontSize(8.5)
           .text(v, colX[i] + 4, y + 4, { width: colW[i], align: 'center' });
      });

      // Línea separadora
      doc.moveTo(40, y + 16).lineTo(555, y + 16).strokeColor('#EEEEEE').lineWidth(0.5).stroke();
      y += 16;
    }

    // Total
    y += 8;
    doc.rect(40, y, 515, 24).fill('#EBF4FF');
    doc.fillColor('#185FA5').font('Helvetica-Bold').fontSize(10)
       .text(`TOTAL HORAS MES: ${Math.floor(totalMinutos/60)}h ${totalMinutos%60}m`, 40, y + 7, { align: 'center', width: 515 });
    y += 34;

    // Firma
    y += 20;
    doc.moveTo(40, y).lineTo(200, y).strokeColor('#AAAAAA').lineWidth(0.5).stroke();
    doc.moveTo(355, y).lineTo(555, y).stroke();
    doc.fillColor('#888888').font('Helvetica').fontSize(8)
       .text('Firma trabajador', 40, y + 4, { width: 160, align: 'center' })
       .text('Firma empresa', 355, y + 4, { width: 200, align: 'center' });

    // Pie de página
    doc.fillColor('#AAAAAA').fontSize(7)
       .text('Documento generado automáticamente por el sistema de fichajes de Kouira S.L conforme al Real Decreto-Ley 8/2019',
             40, 810, { align: 'center', width: 515 });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
});

module.exports = router;
