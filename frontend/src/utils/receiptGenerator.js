import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional PDF receipt for a student fee record matching the "FEE SLIP" design.
 * @param {Object} fee - The fee object from the backend
 */
export const generateFeeReceipt = (fee) => {
    const doc = new jsPDF();
    const student = fee.studentId || {};
    const paidInfo = fee.paymentHistory?.[0] || {};
    
    // Formatters
    const formatCurrency = (amount) => `Rs ${(Number(amount) || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-GB', { 
            day: '2-digit', month: 'short', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', hour12: true 
        }).toLowerCase();
    };

    // Layout constants
    const marginX = 15;
    
    // ------------------------------------------------------------------------
    // 1. HEADER (FEE SLIP Title + Logo box)
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42); // Very dark slate (almost black)
    doc.text('FEE SLIP', marginX, 25);

    // Mock "DF" Logo (A dark square with "DF" in gold-ish color)
    const logoX = 155;
    const logoY = 15;
    const logoSize = 35;
    
    // Logo Outline
    doc.setDrawColor(0);
    doc.setFillColor(15, 20, 30);
    doc.roundedRect(logoX, logoY, logoSize, logoSize, 3, 3, 'FD');
    
    // Logo text
    doc.setFont('times', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text('DF', logoX + 17.5, logoY + 24, { align: 'center' });

    // ------------------------------------------------------------------------
    // 2. De Facto & STUDENT INFO
    // ------------------------------------------------------------------------
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80); // Grayish text
    
    let infoY = 40;
    const lineHeight = 5.5;

    doc.text('De Facto', marginX, infoY);
    infoY += lineHeight;
    doc.text('Target De Facto', marginX, infoY);
    infoY += lineHeight;
    doc.text(`Student: ${student.name || 'N/A'} | Roll No: ${student.rollNo || 'N/A'}`, marginX, infoY);
    infoY += lineHeight;
    doc.text(`Class: ${student.className || 'N/A'} | Batch: ${student.session || 'N/A'}`, marginX, infoY);
    infoY += lineHeight;
    doc.text(`Receipt No: ${paidInfo.receiptNo || 'N/A'}`, marginX, infoY);
    infoY += lineHeight;
    doc.text(`Contact: ${student.contact || 'N/A'}`, marginX, infoY);
    
    infoY += 10;

    // Horizontal Rule
    doc.setDrawColor(200, 200, 200);
    doc.line(marginX, infoY, 195, infoY);
    infoY += 10;

    // ------------------------------------------------------------------------
    // 3. PAYMENT DETAILS PARAGRAPH
    // ------------------------------------------------------------------------
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const paymentText = `PAYMENT DETAILS: This receipt acknowledges the fee payment made by ${student.name || 'Student'} on ${formatDateTime(paidInfo.date)} via ${paidInfo.paymentMethod || 'CASH'} against the billing month of ${fee.month} ${fee.year}. All amounts are recorded in the institutional ledger.`;
    
    const splitText = doc.splitTextToSize(paymentText, 180);
    doc.text(splitText, marginX, infoY);
    infoY += (splitText.length * 5) + 10;

    // ------------------------------------------------------------------------
    // 4. FEE TABLE (Grid style)
    // ------------------------------------------------------------------------
    const tableRows = [];
    
    // Main Entry Row
    tableRows.push([
        'Fee Payment Entry',
        paidInfo.transactionId && paidInfo.transactionId !== 'N/A' ? paidInfo.transactionId : '-',
        `${fee.month} ${fee.year}`,
        formatDate(paidInfo.date),
        formatCurrency(fee.amountPaid || fee.totalFee)
    ]);

    // Add empty rows for visually matching the screenshot's height
    for (let i = 0; i < 7; i++) {
        tableRows.push(['', '', '', '', '']); // Empty cells
    }

    // Amount Calculations
    const targetFee = fee.totalFee || 0;
    // Assuming if fully paid, pending is 0. If partial, pending > 0.
    const amtPaid = fee.amountPaid || targetFee; 
    const balanceBefore = targetFee + (fee.pendingAmount || 0); // Rough estimate of what they owed before paying
    const balanceAfter = fee.pendingAmount || 0;

    // Subtotal Rows (Right Aligned strings spanning 4 columns)
    tableRows.push([
        { content: 'Monthly Fee Target', colSpan: 4, styles: { halign: 'right' } },
        formatCurrency(targetFee)
    ]);
    tableRows.push([
        { content: 'Balance Before Payment', colSpan: 4, styles: { halign: 'right' } },
        formatCurrency(Math.max(amtPaid, targetFee)) // To represent before paying
    ]);
    tableRows.push([
        { content: 'Balance After Payment', colSpan: 4, styles: { halign: 'right' } },
        formatCurrency(balanceAfter)
    ]);

    autoTable(doc, {
        startY: infoY,
        head: [['Description', 'Reference No', 'Billing Month', 'Date', 'Amount']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: 40,
            fontStyle: 'normal',
            lineColor: [180, 180, 180],
            lineWidth: 0.2
        },
        bodyStyles: {
            textColor: 60,
            lineColor: [180, 180, 180],
            lineWidth: 0.2,
            minCellHeight: 10
        },
        columnStyles: {
            4: { halign: 'right' }
        },
        styles: {
            font: 'helvetica',
            fontSize: 9
        },
        margin: { left: marginX, right: marginX }
    });

    // ------------------------------------------------------------------------
    // 5. FINAL TOTALS (Right side boxes)
    // ------------------------------------------------------------------------
    const finalY = doc.lastAutoTable.finalY + 15;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);

    // TOTAL BALANCE Box
    doc.text('TOTAL BALANCE', 105, finalY + 5);
    doc.setDrawColor(150, 150, 150);
    doc.rect(140, finalY, 55, 8);
    doc.text(formatCurrency(balanceAfter), 193, finalY + 5.5, { align: 'right' });

    // AMOUNT PAID Box
    const paidY = finalY + 12;
    doc.text('AMOUNT PAID', 105, paidY + 5);
    doc.rect(140, paidY, 55, 8);
    doc.text(formatCurrency(amtPaid), 193, paidY + 5.5, { align: 'right' });

    // ------------------------------------------------------------------------
    // 6. THICK BOTTOM BORDER
    // ------------------------------------------------------------------------
    // The design has a thick dark bar and a thin gray bar
    doc.setDrawColor(30, 40, 60); // Dark navy
    doc.setLineWidth(1.5);
    doc.line(marginX, 280, 120, 280);

    doc.setDrawColor(200, 200, 200); // Light gray
    doc.setLineWidth(0.5);
    doc.line(125, 280, 195, 280);

    // ------------------------------------------------------------------------
    // 7. SAVE DOCUMENT
    // ------------------------------------------------------------------------
    const cleanName = (student.name || 'Unknown').replace(/\s+/g, '_');
    doc.save(`FeeSlip_${fee.month}_${fee.year}_${cleanName}.pdf`);
};
