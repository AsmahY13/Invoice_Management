import fitz  # PyMuPDF
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import re
import os
from typing import Dict, Any, Optional
import cv2
import numpy as np
from datetime import datetime
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv
import logging
import difflib

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InvoiceExtractor:
    def __init__(self, use_azure=True):
        """
        Initialize the extractor with credentials from environment variables
        """
        # Known vendors with variations for better matching
        self.known_vendors = {
            # KOLOK variations
            r'kol\s*kolok': 'KOLOK',
            r'kolokv?est': 'KOLOK',
            r'kol\s+ok': 'KOLOK',
            r'kolo[kc]': 'KOLOK',
            r'kol.*?bidvest': 'KOLOK',
            r'kolok': 'KOLOK',
            
            # Bidvest variations
            r'bidvest': 'Bidvest',
            r'didvest': 'Bidvest',
            r'bid\s*vest': 'Bidvest',
            
            # Telkom variations
            r'telkom': 'Telkom',
            r'telk?om': 'Telkom',
            
            # Others
            r'vodacom': 'Vodacom',
            r'mtn': 'MTN',
            r'eskom': 'Eskom',
        }
        
        # Exact vendor names for final output
        self.vendor_names = {
            'kolok': 'KOLOK',
            'bidvest': 'Bidvest',
            'telkom': 'Telkom',
            'vodacom': 'Vodacom',
            'mtn': 'MTN',
            'eskom': 'Eskom',
        }
        
        # Set Tesseract path
        self.tesseract_path = os.getenv('TESSERACT_PATH')
        if self.tesseract_path and os.path.exists(self.tesseract_path):
            pytesseract.pytesseract.tesseract_cmd = self.tesseract_path
            logger.info(f"✅ Tesseract found at: {self.tesseract_path}")
        else:
            possible_paths = [
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    logger.info(f"✅ Tesseract found at: {path}")
                    break
        
        # Initialize Azure client
        self.azure_client = None
        if use_azure:
            self.azure_client = self._init_azure_client()
    
    def _init_azure_client(self):
        """Initialize Azure client using environment variables"""
        endpoint = os.getenv('AZURE_ENDPOINT') or os.getenv('AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT')
        key = os.getenv('AZURE_KEY') or os.getenv('AZURE_DOCUMENT_INTELLIGENCE_KEY')
        
        if not endpoint or not key:
            logger.warning("⚠️ Azure credentials not found in environment variables")
            return None
        
        endpoint = endpoint.strip('"\'')
        key = key.strip('"\'')
        
        try:
            client = DocumentAnalysisClient(
                endpoint=endpoint,
                credential=AzureKeyCredential(key)
            )
            logger.info("✅ Azure Document Intelligence initialized successfully")
            return client
        except Exception as e:
            logger.error(f"❌ Azure initialization failed: {e}")
            return None
    
    def _clean_vendor_name(self, vendor: str, full_text: str = "") -> str:
        """
        Aggressively clean up vendor names
        """
        if not vendor:
            return None
        
        # Convert to lowercase for matching
        vendor_lower = vendor.lower().strip()
        
        # Print original for debugging
        logger.info(f"  🔍 Cleaning vendor name: '{vendor}'")
        
        # Special case for KOLOK - check the full text for clues
        if full_text:
            if 'KOLOK' in full_text.upper() or 'kolok' in full_text.lower():
                logger.info("  ✅ Found 'KOLOK' in document text")
                return 'KOLOK'
            if 'Bidvest' in full_text or 'BIDVEST' in full_text.upper():
                # If both appear, KOLOK is the primary vendor
                if 'KOLOK' in full_text.upper():
                    return 'KOLOK'
                return 'Bidvest'
        
        # Check for KOLOK variations first
        if any(word in vendor_lower for word in ['kol', 'kolo', 'kolok', 'bidvest']):
            # Look for KOLOK in the text
            if 'kolok' in vendor_lower or 'kolo' in vendor_lower:
                return 'KOLOK'
            # Look for Bidvest
            if 'bidvest' in vendor_lower or 'didvest' in vendor_lower:
                return 'Bidvest'
        
        # Try pattern matching
        for pattern, corrected in self.known_vendors.items():
            if re.search(pattern, vendor_lower):
                logger.info(f"  ✅ Matched pattern '{pattern}' -> '{corrected}'")
                return corrected
        
        # Fuzzy matching for close matches
        best_match = None
        best_ratio = 0
        
        for known in self.vendor_names.keys():
            ratio = difflib.SequenceMatcher(None, vendor_lower, known).ratio()
            # Also check if known is contained in vendor_lower
            if known in vendor_lower:
                ratio = max(ratio, 0.9)  # Boost if substring match
            if ratio > 0.6 and ratio > best_ratio:  # Lower threshold to 60%
                best_ratio = ratio
                best_match = known
        
        if best_match:
            logger.info(f"  ✅ Fuzzy matched '{vendor}' to '{best_match}' (ratio: {best_ratio:.2f})")
            return self.vendor_names[best_match]
        
        # If all else fails, clean up common OCR errors
        cleaned = vendor
        # Remove extra spaces
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        # Fix common OCR mistakes
        replacements = {
            'KOL KE': 'KOLOK',
            'KOL KOLOK': 'KOLOK',
            'KOLOKVest': 'KOLOK',
            'DIDVest': 'Bidvest',
            'DID Vest': 'Bidvest',
        }
        for wrong, right in replacements.items():
            if wrong in cleaned:
                cleaned = right
                break
        
        # If cleaned is very short, might be wrong
        if len(cleaned) < 3:
            return None
        
        return cleaned
    
    def _clean_invoice_number(self, inv_num: str, full_text: str = "") -> str:
        """
        Clean up invoice number - prefer credit note format when applicable
        """
        if not inv_num:
            return None
        
        logger.info(f"  🔍 Cleaning invoice number: '{inv_num}'")
        
        # If it's a credit note, look for the actual credit note number
        if "CREDIT NOTE" in full_text.upper() or "CREDITNOTE" in full_text.upper():
            # Look for patterns like 030265587_SL-CN
            cn_match = re.search(r'(\d+_[A-Z]+-\w+)', full_text)
            if cn_match:
                logger.info(f"  ✅ Found credit note number: {cn_match.group(1)}")
                return cn_match.group(1)
            
            # Look for numbers with SL-CN pattern
            sl_match = re.search(r'(\d+_SL-CN)', full_text, re.IGNORECASE)
            if sl_match:
                logger.info(f"  ✅ Found SL-CN number: {sl_match.group(1)}")
                return sl_match.group(1)
        
        # If it's just digits and too short, might be wrong
        if inv_num.isdigit() and len(inv_num) < 8:
            # Look for better alternatives in the text
            alternatives = re.findall(r'([A-Z0-9]+_[A-Z0-9]+)', full_text)
            if alternatives:
                logger.info(f"  ✅ Found alternative: {alternatives[0]}")
                return alternatives[0]
            
            # Look for alphanumeric patterns
            alnum = re.findall(r'([A-Z]\d{8,})', full_text)
            if alnum:
                logger.info(f"  ✅ Found alphanumeric: {alnum[0]}")
                return alnum[0]
        
        return inv_num
    
    def _clean_amount(self, amount: float, document_type: str) -> float:
        """
        Ensure amount is positive for credit notes
        """
        if amount is None:
            return None
        
        # Credit notes might come as negative, make them positive
        if document_type == 'credit_note' and amount < 0:
            return abs(amount)
        
        return amount
    
    def extract_from_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Main extraction function with post-processing
        """
        logger.info(f"\n🔍 Processing: {os.path.basename(pdf_path)}")
        
        # Extract raw text first for context
        raw_text = self._extract_raw_text(pdf_path)
        
        # Try Azure first
        if self.azure_client:
            logger.info("☁️ Attempting Azure Document Intelligence...")
            azure_result = self._extract_with_azure(pdf_path)
            
            # Add raw text to result
            azure_result['raw_text'] = raw_text
            
            # Post-process Azure results with full text context
            azure_result = self._post_process_results(azure_result, raw_text)
            
            if self._is_azure_result_reliable(azure_result):
                logger.info("✅ Azure extraction successful!")
                return azure_result
            else:
                logger.info("⚠️ Azure results incomplete, falling back to local methods...")
        
        # Fallback to local methods
        has_text = self._check_if_text_pdf(pdf_path)
        
        if has_text:
            logger.info("📄 Using pdfplumber (fallback)")
            return self._extract_with_pdfplumber(pdf_path)
        else:
            logger.info("🖼️ Using OCR (fallback)")
            return self._extract_with_ocr(pdf_path)
    
    def _extract_raw_text(self, pdf_path: str) -> str:
        """Extract raw text from PDF for context"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                return text
        except:
            return ""
    
    def _post_process_results(self, result: Dict[str, Any], raw_text: str) -> Dict[str, Any]:
        """
        Clean up and correct Azure extraction results
        """
        # Clean vendor name with full text context
        if result.get('vendor'):
            result['vendor'] = self._clean_vendor_name(result['vendor'], raw_text)
        
        # Clean invoice number with context
        if result.get('invoice_number'):
            result['invoice_number'] = self._clean_invoice_number(
                result['invoice_number'], 
                raw_text
            )
        
        # Clean amount based on document type
        if result.get('amount'):
            result['amount'] = self._clean_amount(
                result['amount'],
                result.get('document_type', 'invoice')
            )
        
        # If vendor is still None, try to find it in raw text
        if not result.get('vendor'):
            # Look for KOLOK in text
            if 'KOLOK' in raw_text.upper():
                result['vendor'] = 'KOLOK'
                logger.info("  ✅ Found KOLOK in raw text")
            elif 'Bidvest' in raw_text or 'BIDVEST' in raw_text.upper():
                result['vendor'] = 'Bidvest'
                logger.info("  ✅ Found Bidvest in raw text")
        
        return result
    
    def _is_azure_result_reliable(self, result: Dict[str, Any]) -> bool:
        """Check if Azure results are reliable enough to use"""
        if result.get('error'):
            return False
        
        # Count how many fields we have
        fields_found = sum(1 for k in ['vendor', 'invoice_number', 'amount'] if result.get(k))
        
        # For credit notes, we need at least amount
        if result.get('document_type') == 'credit_note':
            return fields_found >= 2 and result.get('amount') is not None
        
        # For invoices, we want at least 2 of the 3 main fields
        return fields_found >= 2
    
    def _extract_with_azure(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract using Azure Document Intelligence prebuilt invoice model
        """
        extracted = {
            'vendor': None,
            'invoice_number': None,
            'amount': None,
            'vat_amount': None,
            'date': None,
            'document_type': 'invoice',
            'raw_text': '',
            'confidence': {},
            'method': 'azure'
        }
        
        try:
            with open(pdf_path, "rb") as pdf_file:
                pdf_data = pdf_file.read()
            
            logger.info("  ⏳ Waiting for Azure response...")
            poller = self.azure_client.begin_analyze_document(
                model_id="prebuilt-invoice",
                document=pdf_data
            )
            result = poller.result()
            
            if result.documents:
                doc = result.documents[0]
                fields = doc.fields
                
                # Extract vendor name
                if fields.get("VendorName"):
                    extracted['vendor'] = fields["VendorName"].value
                    extracted['confidence']['vendor'] = fields["VendorName"].confidence
                    logger.info(f"  ✅ Azure found vendor: {extracted['vendor']}")
                
                # Extract invoice number
                if fields.get("InvoiceId"):
                    extracted['invoice_number'] = fields["InvoiceId"].value
                    extracted['confidence']['invoice_number'] = fields["InvoiceId"].confidence
                    logger.info(f"  ✅ Azure found invoice number: {extracted['invoice_number']}")
                
                # Extract total amount
                if fields.get("InvoiceTotal"):
                    amount_value = fields["InvoiceTotal"].value
                    if amount_value and hasattr(amount_value, 'amount'):
                        extracted['amount'] = float(amount_value.amount)
                        extracted['confidence']['amount'] = fields["InvoiceTotal"].confidence
                        logger.info(f"  ✅ Azure found amount: R{extracted['amount']:.2f}")
                
                # Extract date
                if fields.get("InvoiceDate"):
                    date_value = fields["InvoiceDate"].value
                    if date_value:
                        extracted['date'] = str(date_value)
                        extracted['confidence']['date'] = fields["InvoiceDate"].confidence
                        logger.info(f"  ✅ Azure found date: {extracted['date']}")
                
                # Extract tax/VAT
                if fields.get("TotalTax"):
                    tax_value = fields["TotalTax"].value
                    if tax_value and hasattr(tax_value, 'amount'):
                        extracted['vat_amount'] = float(tax_value.amount)
                        extracted['confidence']['vat_amount'] = fields["TotalTax"].confidence
                        logger.info(f"  ✅ Azure found VAT: R{extracted['vat_amount']:.2f}")
                
                # Determine document type
                if fields.get("InvoiceTotal") and fields["InvoiceTotal"].value:
                    amount = fields["InvoiceTotal"].value
                    if hasattr(amount, 'amount') and amount.amount < 0:
                        extracted['document_type'] = 'credit_note'
                        logger.info(f"  📝 Azure classified as: CREDIT NOTE")
                    else:
                        extracted['document_type'] = 'invoice'
                        logger.info(f"  📝 Azure classified as: INVOICE")
            
        except Exception as e:
            logger.error(f"⚠️ Azure extraction error: {e}")
            extracted['error'] = str(e)
        
        return extracted
    
    # [All your fallback methods remain exactly the same as before]
    def _check_if_text_pdf(self, pdf_path: str) -> bool:
        """Check if PDF contains selectable text"""
        try:
            with fitz.open(pdf_path) as doc:
                for page in doc:
                    if page.get_text().strip():
                        return True
            return False
        except Exception as e:
            logger.error(f"Error checking PDF: {e}")
            return False
    
    def _classify_document_type(self, text: str) -> str:
        """Determine if document is invoice or credit note (fallback)"""
        text_lower = text.lower()
        
        credit_indicators = ['credit note', 'creditnote', 'credit memo', 'refund']
        for indicator in credit_indicators:
            if indicator in text_lower:
                return "credit_note"
        
        invoice_indicators = ['invoice', 'tax invoice', 'bill to', 'invoice number']
        for indicator in invoice_indicators:
            if indicator in text_lower:
                return "invoice"
        
        return "invoice"
    
    def _extract_with_pdfplumber(self, pdf_path: str) -> Dict[str, Any]:
        """Fallback: extract using pdfplumber"""
        extracted = {
            'vendor': None,
            'invoice_number': None,
            'amount': None,
            'vat_amount': None,
            'date': None,
            'document_type': 'invoice',
            'raw_text': '',
            'method': 'pdfplumber'
        }
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    text = page.extract_text() or ""
                    full_text += text + "\n"
                    
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if row:
                                full_text += " ".join(str(cell) for cell in row if cell) + "\n"
                
                extracted['raw_text'] = full_text
                extracted['document_type'] = self._classify_document_type(full_text)
                extracted.update(self._parse_invoice_fields_fallback(full_text))
                
        except Exception as e:
            logger.error(f"⚠️ pdfplumber error: {e}")
        
        return extracted
    
    def _extract_with_ocr(self, pdf_path: str) -> Dict[str, Any]:
        """Fallback: extract using OCR"""
        extracted = {
            'vendor': None,
            'invoice_number': None,
            'amount': None,
            'vat_amount': None,
            'date': None,
            'document_type': 'invoice',
            'raw_text': '',
            'method': 'ocr'
        }
        
        try:
            images = convert_from_path(pdf_path, dpi=300)
            full_text = ""
            
            for image in images:
                img = np.array(image)
                gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
                _, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)
                page_text = pytesseract.image_to_string(thresh, lang='eng')
                full_text += page_text + "\n"
            
            extracted['raw_text'] = full_text
            extracted['document_type'] = self._classify_document_type(full_text)
            extracted.update(self._parse_invoice_fields_fallback(full_text))
            
        except Exception as e:
            logger.error(f"⚠️ OCR error: {e}")
        
        return extracted
    
    def _parse_invoice_fields_fallback(self, text: str) -> Dict[str, Any]:
        """Fallback regex parsing"""
        fields = {}
        
        # Vendor patterns
        vendor_patterns = [
            r'(Telkom|Vodacom|MTN|Eskom|KOLOK|Bidvest)',
            r'From:\s*([A-Z][A-Za-z\s]+(?:Ltd|Pty|Inc|CC)?)',
        ]
        
        for pattern in vendor_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                fields['vendor'] = match.group(1).strip()
                break
        
        # Invoice number patterns
        inv_patterns = [
            r'Invoice\s*no\s*(\w+\d+\w+)',
            r'Invoice\s*Number:\s*(\w+[-]?\w+)',
            r'([A-Z]\d{8,})',
            r'(\d+_[A-Z]+-\w+)',  # Pattern for credit note
        ]
        
        for pattern in inv_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                fields['invoice_number'] = value
                break
        
        # Amount patterns
        amount_patterns = [
            r'Total\s*Due:\s*R\s*([\d,]+\.?\d*)',
            r'Grand\s*Total:\s*R\s*([\d,]+\.?\d*)',
            r'R\s*([1-9][\d,]+\.?\d*)',
            r'-R\s*([\d,]+\.?\d*)',  # Negative amounts for credit notes
        ]
        
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    value = float(match.group(1).replace(',', ''))
                    if value > 0:
                        fields['amount'] = value
                        break
                except:
                    continue
        
        # Date patterns
        date_patterns = [
            r'Invoice\s*Date\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})',
            r'Date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                fields['date'] = match.group(1).strip()
                break
        
        return fields

# Example usage for testing
if __name__ == "__main__":
    import tkinter as tk
    from tkinter import filedialog
    
    print("="*60)
    print("🧪 AZURE DOCUMENT INTELLIGENCE TEST")
    print("="*60)
    print("📝 Using credentials from .env file")
    print("="*60)
    
    # Initialize extractor
    extractor = InvoiceExtractor(use_azure=True)
    
    # Ask how user wants to select file
    print("\n📂 How do you want to select the PDF?")
    print("1. Enter file path manually")
    print("2. Open file dialog (GUI)")
    
    choice = input("Choose (1 or 2): ").strip()
    
    pdf_path = None
    
    if choice == "2":
        # Open file dialog
        root = tk.Tk()
        root.withdraw()
        pdf_path = filedialog.askopenfilename(
            title="Select Invoice/Credit Note PDF",
            filetypes=[("PDF files", "*.pdf")]
        )
    else:
        # Manual entry
        print("\n📂 Enter the path to your PDF file:")
        pdf_path = input(">>> ").strip().strip('"')
    
    if pdf_path and os.path.exists(pdf_path):
        print(f"\n{'='*60}")
        print(f"TESTING: {os.path.basename(pdf_path)}")
        print(f"{'='*60}")
        
        result = extractor.extract_from_pdf(pdf_path)
        
        print("\n" + "="*60)
        print("📊 EXTRACTION RESULTS")
        print("="*60)
        for key, value in result.items():
            if key not in ['raw_text', 'confidence']:
                if key in ['amount', 'vat_amount'] and value:
                    print(f"{key:20}: R{value:.2f}")
                elif key in ['amount', 'vat_amount']:
                    print(f"{key:20}: Not found")
                else:
                    print(f"{key:20}: {value}")
        
        if result.get('confidence'):
            print("\n📈 Confidence Scores:")
            for field, score in result['confidence'].items():
                print(f"  {field:15}: {score:.0%}")
        
        print("="*60)
    else:
        print(f"\n❌ File not found or no file selected")

    print("\n✨ Test complete!")