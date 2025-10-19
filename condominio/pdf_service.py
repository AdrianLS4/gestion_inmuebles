from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, Image
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from io import BytesIO
from django.http import HttpResponse
import os

# ==================== PALETA DE COLORES ====================
COLOR_PRIMARY = colors.HexColor('#2c5282')
COLOR_HEADER = colors.HexColor('#2d3748')
COLOR_ACCENT = colors.HexColor('#e53e3e')
COLOR_LIGHT = colors.HexColor('#f7fafc')
COLOR_BORDER = colors.HexColor('#cbd5e0')
COLOR_TEXT = colors.HexColor('#2d3748')

# ==================== LOGO (ruta dentro del proyecto) ====================
LOGO_PATH = os.path.join('static', 'img', 'logo_condominio.png')

# ==================== FOOTER PERSONALIZADO ====================
class FooterCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_footer()
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_footer(self):
        self.saveState()
        self.setStrokeColor(COLOR_BORDER)
        self.setLineWidth(0.8)
        self.line(50, 35, letter[0] - 50, 35)
        self.setFont('Helvetica', 8)
        self.setFillColor(COLOR_HEADER)
        self.drawCentredString(letter[0] / 2.0, 22,
                               "Condominio Los Jardines • Gestión Administrativa")
        self.restoreState()

# ==================== GENERACIÓN DEL PDF ====================
def generar_pdf_recibo(recibo):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=60
    )

    story = []
    page_width = letter[0] - 100  # ancho útil de la página

    # ==================== ENCABEZADO ====================
    header_elements = []

    if os.path.exists(LOGO_PATH):
        logo = Image(LOGO_PATH, width=1.2 * inch, height=1.2 * inch)
        logo.hAlign = 'LEFT'
        header_elements.append(logo)
    else:
        header_elements.append(Spacer(1, 1.2 * inch))

    header_text_data = [
        ['CONDOMINIO LOS JARDINES'],
        ['Administración Residencial']
    ]
    header_table = Table(header_text_data, colWidths=[page_width - 100])
    header_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 20),
        ('TEXTCOLOR', (0, 0), (0, 0), COLOR_HEADER),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 1), (0, 1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (0, 1), 9),
        ('TEXTCOLOR', (0, 1), (0, 1), COLOR_PRIMARY),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))

    header_container = Table([[header_elements[0], header_table]], colWidths=[100, page_width - 100])
    header_container.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(header_container)

    # línea divisoria elegante
    story.append(Spacer(1, 6))
    divider = Table([['']], colWidths=[page_width])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, 0), 1, COLOR_PRIMARY),
    ]))
    story.append(divider)
    story.append(Spacer(1, 8))

    # ==================== TÍTULO ====================
    meses = ['', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
             'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']
    mes_nombre = meses[recibo.fecha_emision.month]

    titulo_data = [
        ['RECIBO DE CONDOMINIO'],
        [f"No. {recibo.numero_recibo} • {mes_nombre} {recibo.fecha_emision.year}"]
    ]
    titulo_table = Table(titulo_data, colWidths=[page_width])
    titulo_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 14),
        ('TEXTCOLOR', (0, 0), (0, 0), COLOR_HEADER),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (0, 1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (0, 1), 9),
        ('TEXTCOLOR', (0, 1), (0, 1), COLOR_PRIMARY),
    ]))
    story.append(titulo_table)
    story.append(Spacer(1, 10))

    # ==================== DATOS DEL PROPIETARIO ====================
    def section_header(title):
        h = Table([[title]], colWidths=[page_width])
        h.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), COLOR_PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        return h

    story.append(section_header('DATOS DEL PROPIETARIO'))

    prop_data = [
        ['Propietario:', f"{recibo.id_inmueble.propietario.nombre} {recibo.id_inmueble.propietario.apellido}"],
        ['Inmueble:', f"Edificio {recibo.id_inmueble.edificio.numero_edificio}, Piso {recibo.id_inmueble.piso}, Apartamento {recibo.id_inmueble.apartamento}"],
        ['Alícuota:', f"{float(recibo.id_inmueble.alicuota):.6f}"],
        ['Fecha de Emisión:', f"{recibo.fecha_emision.day:02d} de {mes_nombre.title()} de {recibo.fecha_emision.year}"],
    ]

    prop_table = Table(prop_data, colWidths=[page_width * 0.3, page_width * 0.7])
    prop_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_TEXT),
        ('TEXTCOLOR', (0, 0), (0, -1), COLOR_HEADER),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
    ]))
    story.append(prop_table)
    story.append(Spacer(1, 8))

    # ==================== DETALLE DE GASTOS ====================
    story.append(section_header('DETALLE DE GASTOS DEL PERÍODO'))

    gastos_data = [['Descripción', 'Tipo', 'Monto']]
    for detalle in recibo.detalles.all():
        tipo_gasto = 'Común' if detalle.tipo_gasto == 'Comun' else 'No Común'
        gastos_data.append([detalle.descripcion_gasto, tipo_gasto, f"${float(detalle.monto_calculado):,.2f}"])

    gastos_table = Table(gastos_data, colWidths=[page_width * 0.60, page_width * 0.20, page_width * 0.20])
    gastos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), COLOR_HEADER),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
        ('ALIGN', (2, 0), (2, 0), 'RIGHT'),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT]),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('ALIGN', (2, 1), (2, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
    ]))
    story.append(gastos_table)
    story.append(Spacer(1, 6))

    # ==================== RESUMEN FINANCIERO ====================
    story.append(section_header('RESUMEN FINANCIERO'))

    resumen_data = [
        ['Deuda Anterior:', f"${float(recibo.monto_deuda_anterior):,.2f}"],
        ['Cargos del Mes:', f"${float(recibo.monto_cargos_mes):,.2f}"],
        ['Interés de Mora:', f"${float(recibo.monto_interes_mora):,.2f}"],
    ]

    resumen_table = Table(resumen_data, colWidths=[page_width * 0.65, page_width * 0.35])
    resumen_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
    ]))
    story.append(resumen_table)

    # Total a pagar
    total_data = [['TOTAL A PAGAR:', f"${float(recibo.monto_total_pagar):,.2f}"]]
    total_table = Table(total_data, colWidths=[page_width * 0.65, page_width * 0.35])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_ACCENT),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(total_table)

    # Saldo pendiente
    saldo_data = [['Saldo Pendiente:', f"${float(recibo.saldo_pendiente):,.2f}"]]
    saldo_table = Table(saldo_data, colWidths=[page_width * 0.65, page_width * 0.35])
    saldo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT),
        ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_TEXT),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(saldo_table)
    story.append(Spacer(1, 6))

    # ==================== INFORMACIÓN DE PAGO ====================
    story.append(section_header('INFORMACIÓN PARA REALIZAR EL PAGO'))

    pago_data = [
        ['Banco:', 'Banco de Venezuela'],
        ['Número de Cuenta:', '0102-1234-56-7890123456'],
        ['Titular:', 'Condominio Los Jardines'],
        ['RIF:', 'J-123456789-0'],
    ]
    pago_table = Table(pago_data, colWidths=[page_width * 0.3, page_width * 0.7])
    pago_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_TEXT),
        ('BOX', (0, 0), (-1, -1), 1, COLOR_BORDER),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(pago_table)
    story.append(Spacer(1, 4))

    # ==================== NOTA ====================
    nota_text = (
        "IMPORTANTE: Este recibo constituye constancia de la deuda pendiente. "
        "Los pagos realizados después del vencimiento generarán intereses por mora según el reglamento. "
        "Para consultas, comuníquese con la administración."
    )
    nota = Table([[nota_text]], colWidths=[page_width])
    nota.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Oblique'),
        ('FONTSIZE', (0, 0), (-1, -1), 7),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4a5568')),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(nota)

    # ==================== CONSTRUCCIÓN ====================
    doc.build(story, canvasmaker=FooterCanvas)
    buffer.seek(0)
    return buffer


def crear_respuesta_pdf(recibo):
    pdf_buffer = generar_pdf_recibo(recibo)
    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="recibo_{recibo.numero_recibo}.pdf"'
    return response
