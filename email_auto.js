const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");


const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "mxelogs@gmail.com",
        pass: "rpxq ovrm znvb xjeo", // Use environment variables for sensitive data
    },
});

async function sendEmailWithAttachment() {
    try {
        // Read the Flag_create value from the log file
        const flagCreateValue = fs.readFileSync('flag_create_log.txt', 'utf-8').trim();
        console.log('Value: ',flagCreateValue);
        const flagUpdateValue = fs.readFileSync('flag_updateVisit_log.txt', 'utf-8').trim();
        console.log('Value: ',flagUpdateValue);
        const flagDeleteValue = fs.readFileSync('flag_deletion_log.txt','utf-8').trim();
        console.log('Value: ',flagDeleteValue);
        const flagCreateObjectiveValue = fs.readFileSync('flag_createobj_log.txt', 'utf-8').trim();
        console.log('Value: ',flagCreateObjectiveValue);
        const flagUpdateObjectiveValue = fs.readFileSync('flag_updateobj_log.txt', 'utf-8').trim();
        console.log('Value: ',flagUpdateObjectiveValue);
        const flagDeleteObjectiveValue = fs.readFileSync('flag_deletion_log.txt', 'utf-8').trim();
        console.log('Value: ',flagDeleteObjectiveValue);
        const flagmwVisitValue = fs.readFileSync('flag_mw_visit_log.txt', 'utf-8').trim();
        console.log('Value: ',flagmwVisitValue);
        const flagmwObjectiveValue = fs.readFileSync('flag_mw_objective_log.txt', 'utf-8').trim();
        console.log('Value: ',flagmwObjectiveValue);


        // Define the path to the generated PDF report
        const pdfFilePath = path.join(__dirname, 'last_visit_and_objective_report.pdf');

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"SAP Logs" <mxelogs@gmail.com>',
             to: "mudit.saraff@sap.com,neelagandan.s@sap.com,siddharth.khattar@sap.com",
            // to: "mudit.saraff@sap.com,neelagandan.s@sap.com,siddharth.khattar@sap.com,krupa.p@sap.com,prashanth.moorthy@sap.com,gautham.chendilnathan@sap.com,govinda.kumar@sap.com,ch.kudumula@sap.com,deepak.gahlot@sap.com,appaiah.ketolira.ganapathy@sap.com,pramod.sidlaghatta.jaiprakash@sap.com,harsha.devaraju@sap.com,sandeep.thekkina.purayil@sap.com,pradeep.kachhawaha@sap.com,ravindra.kumar.jain@sap.com,livin.dcruz@sap.com,ganeswararao.adapa@sap.com,shishir.chandrakar@sap.com",
            subject: "App Health Check Email",
            text: "Please find the attached report along with the simplified table.",
            html: `
                <h3>Report Details</h3>
                <p>Please find the attached report with details.</p>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <th style="border: 1px solid #dddddd; padding: 8px; text-align: left;">CNS</th>
                        <th style="border: 1px solid #dddddd; padding: 8px; text-align: left;">Create</th>
                        <th style="border: 1px solid #dddddd; padding: 8px; text-align: left;">Update</th>
                        <th style="border: 1px solid #dddddd; padding: 8px; text-align: left;">Delete</th> 
                    </tr>
                    <tr>
                        <td style="border: 1px solid #dddddd; padding: 8px;"><b><i>Visits</b></i></td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagCreateValue === '0' ? '✅' : '❌'}</td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagUpdateValue === '0' ? '✅' : '❌'}</td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagDeleteValue === '0' ? '✅' : '❌'}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #dddddd; padding: 8px;"><b><i>Objectives</b></i></td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagCreateObjectiveValue === '0' ? '✅' : '❌'}</td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagUpdateObjectiveValue === '0' ? '✅' : '❌'}</td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagDeleteObjectiveValue === '0' ? '✅' : '❌'}</td>
                    </tr>
                </table>
                <br>
                <table style="width: 100%; border-collapse: collapse;">
                     <tr>
                        <th style="border: 1px solid #dddddd; padding: 8px; text-align: left;">MiddleWare</th> 
                        <th style="border: 1px solid #dddddd; padding: 8px; text-align: left;"></th> 

                     </tr>
                     <tr>
                        <td style="border: 1px solid #dddddd; padding: 8px;"><b><i>Visits</b></i></td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagmwVisitValue === '0' ? '✅' : '❌'}</td>                     
                    </tr>
                     <tr>
                        <td style="border: 1px solid #dddddd; padding: 8px;"><b><i>Objectives</b></i></td>
                        <td style="border: 1px solid #dddddd; padding: 8px;">${flagmwObjectiveValue=== '0' ? '✅' : '❌'}</td>
                    </tr>
                </table>
            `,
            attachments: [
                {
                    filename: 'last_visit_and_objective_report.pdf',
                    path: pdfFilePath
                },
            ],
        });

        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

// Call the function to send email
sendEmailWithAttachment();
