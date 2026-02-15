"""
Flux – Export Manager
Handles PDF generation for bibliography and other exports.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from fpdf import FPDF
import tempfile
import os
from datetime import datetime
from typing import List, Dict

# Maintain the original models if they were already in use, 
# but here we follow the user's specific request for the generator logic.

def generate_bibliography_pdf(resources: List[Dict]) -> bytes:
    if not resources:
        return b""

    try:
        pdf = FPDF()
        pdf.add_page()
        
        # Use standard fonts to avoid "font not found" errors
        pdf.set_font("Helvetica", "B", 16)
        pdf.cell(0, 10, "Project Learning Bibliography", ln=True, align='C')
        pdf.ln(10)

        for res in resources:
            # Title
            pdf.set_font("Helvetica", "B", 12)
            pdf.set_text_color(0, 0, 0)
            
            # Extract fields with fallbacks
            res_type = res.get('type', 'Resource')
            res_title = res.get('title', 'Untitled')
            res_url = res.get('url', '#')
            res_reason = res.get('reason', 'No context provided.')

            # sanitize content to prevent latin-1 encode errors
            safe_title = res_title.encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 8, f"[{res_type}] {safe_title}")
            
            # Link
            pdf.set_font("Helvetica", "U", 10)
            pdf.set_text_color(0, 0, 255) # Blue
            pdf.cell(0, 6, "Link to Resource", link=res_url, ln=True)
            
            # Reason
            pdf.set_font("Helvetica", "I", 10)
            pdf.set_text_color(80, 80, 80) # Gray
            safe_reason = res_reason.encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 5, f"Why: {safe_reason}")
            
            pdf.ln(5)

        # Output to bytes
        return pdf.output(dest='S').encode('latin-1')

    except Exception as e:
        print(f"PDF Gen Error: {str(e)}")
        raise Exception(f"PDF Generation Failed: {str(e)}")
