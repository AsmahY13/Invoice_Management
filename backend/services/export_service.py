from sqlalchemy.orm import Session
import models
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
import reportlab.platypus as platypus   # ✅ FIXED (namespaced import)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
import io
import openpyxl
from datetime import datetime
import traceback


class ExportService:
    def __init__(self, db: Session):
        self.db = db

    # ==========================
    # EXCEL EXPORT
    # ==========================
    def export_to_excel(self, filters: dict) -> bytes:
        try:
            documents = self._get_filtered_documents(filters)

            if not documents:
                df = pd.DataFrame(
                    [{"Message": "No documents found for the selected filters"}]
                )
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine="openpyxl") as writer:
                    df.to_excel(writer, sheet_name="Documents", index=False)
                output.seek(0)
                return output.getvalue()

            data = []
            for doc in documents:
                data.append({
                    "Filename": doc.filename or "",
                    "Type": doc.document_type or "",
                    "Vendor": doc.vendor or "",
                    "Invoice #": doc.invoice_number or "",
                    "Amount": float(doc.amount) if doc.amount else 0.0,
                    "VAT": float(doc.vat_amount) if doc.vat_amount else 0.0,
                    "Date": doc.date.strftime("%Y-%m-%d") if doc.date else "",
                    "Status": doc.status or "",
                    "Duplicate": "Yes" if doc.is_duplicate else "No",
                    "Uploaded": doc.upload_date.strftime("%Y-%m-%d") if doc.upload_date else ""
                })

            df = pd.DataFrame(data)

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, sheet_name="Documents", index=False)

                worksheet = writer.sheets["Documents"]
                for i, column in enumerate(df.columns):
                    column_width = max(
                        df[column].astype(str).map(len).max(),
                        len(column)
                    )
                    worksheet.column_dimensions[
                        chr(65 + i)
                    ].width = min(max(column_width + 2, 8), 50)

            output.seek(0)
            return output.getvalue()

        except Exception as e:
            print(f"❌ Excel Export Error: {e}")
            print(traceback.format_exc())

            error_df = pd.DataFrame([{"Error": f"Excel export failed: {e}"}])
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                error_df.to_excel(writer, sheet_name="Error", index=False)
            output.seek(0)
            return output.getvalue()

    # ==========================
    # PDF EXPORT
    # ==========================
    def export_to_pdf(self, filters: dict) -> bytes:
        try:
            documents = self._get_filtered_documents(filters)

            buffer = io.BytesIO()
            pdf_doc = platypus.SimpleDocTemplate(
                buffer,
                pagesize=landscape(letter)
            )
            elements = []
            styles = getSampleStyleSheet()

            if not documents:
                elements.append(
                    platypus.Paragraph(
                        "No documents found for the selected filters",
                        styles["Title"]
                    )
                )
                pdf_doc.build(elements)
                buffer.seek(0)
                return buffer.getvalue()

            # Title
            elements.append(
                platypus.Paragraph(
                    f"Document Report - {datetime.now().strftime('%Y-%m-%d')}",
                    styles["Title"]
                )
            )
            elements.append(platypus.Spacer(1, 0.2 * inch))

            # Totals
            total_amount = 0
            total_vat = 0

            for d in documents:
                try:
                    if d.amount:
                        total_amount += float(d.amount)
                except:
                    pass

                try:
                    if d.vat_amount:
                        total_vat += float(d.vat_amount)
                except:
                    pass

            elements.append(
                platypus.Paragraph(
                    f"Total Documents: {len(documents)} | "
                    f"Total Amount: R{total_amount:,.2f} | "
                    f"Total VAT: R{total_vat:,.2f}",
                    styles["Normal"]
                )
            )
            elements.append(platypus.Spacer(1, 0.2 * inch))

            # Table
            table_data = [
                ["Filename", "Vendor", "Invoice #", "Amount", "VAT", "Status"]
            ]

            for d in documents[:50]:
                filename = str(d.filename) if d.filename else "N/A"
                vendor = str(d.vendor) if d.vendor else "N/A"
                invoice = str(d.invoice_number) if d.invoice_number else "N/A"

                if len(filename) > 30:
                    filename = filename[:27] + "..."
                if len(vendor) > 20:
                    vendor = vendor[:17] + "..."
                if len(invoice) > 15:
                    invoice = invoice[:12] + "..."

                try:
                    amount = f"R{float(d.amount):,.2f}" if d.amount else "R0.00"
                except:
                    amount = "R0.00"

                try:
                    vat = f"R{float(d.vat_amount):,.2f}" if d.vat_amount else "R0.00"
                except:
                    vat = "R0.00"

                status = str(d.status) if d.status else "N/A"

                table_data.append([
                    filename,
                    vendor,
                    invoice,
                    amount,
                    vat,
                    status
                ])

            table = platypus.Table(
                table_data,
                colWidths=[
                    2.2 * inch,
                    1.5 * inch,
                    1.3 * inch,
                    0.8 * inch,
                    0.8 * inch,
                    1 * inch
                ]
            )

            table.setStyle(platypus.TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),

                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ("FONTSIZE", (0, 1), (-1, -1), 8),
                ("ALIGN", (3, 1), (4, -1), "RIGHT"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))

            elements.append(table)

            elements.append(platypus.Spacer(1, 0.2 * inch))
            elements.append(
                platypus.Paragraph(
                    f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                    styles["Normal"]
                )
            )

            pdf_doc.build(elements)
            buffer.seek(0)
            return buffer.getvalue()

        except Exception as e:
            print(f"❌ PDF Export Error: {e}")
            print(traceback.format_exc())

            buffer = io.BytesIO()
            pdf_doc = platypus.SimpleDocTemplate(
                buffer,
                pagesize=landscape(letter)
            )
            elements = []
            styles = getSampleStyleSheet()

            elements.append(
                platypus.Paragraph(
                    f"PDF generation failed: {e}",
                    styles["Title"]
                )
            )

            pdf_doc.build(elements)
            buffer.seek(0)
            return buffer.getvalue()

    # ==========================
    # FILTER FUNCTION
    # ==========================
    def _get_filtered_documents(self, filters: dict):
        try:
            query = self.db.query(models.Document)

            if filters.get("vendor"):
                query = query.filter(
                    models.Document.vendor.ilike(f"%{filters['vendor']}%")
                )

            if filters.get("status"):
                query = query.filter(
                    models.Document.status == filters["status"]
                )

            if filters.get("start_date"):
                start_date = datetime.fromisoformat(filters["start_date"])
                query = query.filter(
                    models.Document.date >= start_date
                )

            if filters.get("end_date"):
                end_date = datetime.fromisoformat(filters["end_date"])
                query = query.filter(
                    models.Document.date <= end_date
                )

            if filters.get("doc_type"):
                query = query.filter(
                    models.Document.document_type == filters["doc_type"]
                )

            return query.all()

        except Exception as e:
            print(f"❌ Filter error: {e}")
            return []