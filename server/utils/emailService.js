const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a password reset OTP email
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendPasswordResetEmail(toEmail, otp) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'InteriorDesk <onboarding@resend.dev>',
            to: toEmail,
            subject: 'Your Password Reset Code - InteriorDesk',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #C25E00; margin: 0; font-size: 28px;">InteriorDesk</h1>
                    </div>
                    
                    <div style="background: #FAF9F7; border-radius: 12px; padding: 30px; border: 1px solid #E8E4DE;">
                        <h2 style="color: #2C2825; margin: 0 0 20px 0; font-size: 22px;">Password Reset Code</h2>
                        
                        <p style="color: #5C5650; line-height: 1.6; margin: 0 0 20px 0;">
                            Use the following code to reset your password:
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #FFF; border: 2px dashed #C25E00; border-radius: 12px; padding: 20px 40px; display: inline-block;">
                                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #C25E00;">${otp}</span>
                            </div>
                        </div>
                        
                        <p style="color: #8C867E; font-size: 14px; line-height: 1.6; margin: 0;">
                            This code will expire in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.
                        </p>
                    </div>
                    
                    <p style="color: #8C867E; font-size: 12px; text-align: center; margin-top: 30px;">
                        © ${new Date().getFullYear()}   InteriorDesk. All rights reserved.
                    </p>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err) {
        console.error('Email send error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Send a quotation PDF email to a client
 */
async function sendQuotationEmail(toEmail, clientName, pdfBase64, quotationTitle, companyName) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'InteriorDesk <onboarding@resend.dev>',
            to: toEmail,
            subject: `Your Quotation: ${quotationTitle}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: #FAF9F7; border-radius: 12px; padding: 30px; border: 1px solid #E8E4DE;">
                        <h2 style="color: #2C2825; margin: 0 0 20px 0; font-size: 22px;">Hello ${clientName},</h2>
                        
                        <p style="color: #5C5650; line-height: 1.6; margin: 0 0 20px 0;">
                            Please find attached your quotation for <strong>${quotationTitle}</strong> from ${companyName}.
                        </p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Quotation-${quotationTitle.replace(/\s+/g, '_')}.pdf`,
                    content: Buffer.from(pdfBase64, 'base64')
                }
            ]
        });

        if (error) {
            console.error('Resend error:', JSON.stringify(error));
            return { success: false, error: error.message || JSON.stringify(error) };
        }
        return { success: true, data };
    } catch (err) {
        console.error('Email send error:', err);
        return { success: false, error: err.message };
    }
}

module.exports = { sendPasswordResetEmail, sendQuotationEmail };
