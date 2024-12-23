const fs = require('fs');
const PDFDocument = require('pdfkit');
const { exec } = require('child_process');
const { executeHttpRequest, getDestination } = require('@sap-cloud-sdk/core');
const cron = require('node-cron'); // Importing the cron package

// SAP Destination name
const destinationName = 'AppHealthCheckObject';

// Array of scripts to run sequentially
const scripts = [
    'accesstoken.js',
    'createVisit.js',
    'mw_get_createVisit.js',
    'createobjective.js',
    'mw_get_createobjective.js',
    'updateobjective.js',
    'mw_get_createobjective.js',
    'updateVisit.js',
    'mw_get_createVisit.js',
    'deleteobjective.js',
    'deleteVisit.js'
];

// Function to read log files and parse JSON lines
const getLogs = (filePath) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return fileContent.trim().split('\n').map(line => JSON.parse(line));
    } catch (err) {
        console.error(`Error reading or parsing log file: ${filePath}`, err);
        return [];
    }
};

// Function to get SAP Destination and make a request to the visit objectives API
const callSAPDestination = async () => {
    try {
        const destination = await getDestination(destinationName);
        if (!destination) {
            throw new Error(`Destination "${destinationName}" not found.`);
        }

        const urlPath = '/sap/c4c/api/v1/visit-objective-task-service/objectives';
        const response = await executeHttpRequest(destination, {
            method: 'GET',
            url: urlPath
        });

        console.log('SAP API Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error connecting to SAP Destination:', error);
        return null;
    }
};

// Function to get the most recent line without a display id
const getMostRecentWithoutDisplayId = (logs) => {
    return logs
        .filter(log => !log.displayid)
        .sort((a, b) => new Date(b.logTimeIST) - new Date(a.logTimeIST))[0];
};

// Function to get the most recent middleware logs
const getRecentMiddlewareLogs = (filePath, limit = 5) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const logs = fileContent.trim().split('\n');
        return logs.slice(-limit);
    } catch (err) {
        console.error(`Error reading middleware log file: ${filePath}`, err);
        return [];
    }
};

// Function to find the last created visit and its associated updates and deletions
const getLastCreatedVisit = (logs) => {
    const lastCreatedVisit = logs
        .filter(log => log.displayid && log.id)
        .sort((a, b) => new Date(b.logTimeIST) - new Date(a.logTimeIST))[0];

    const mostRecentWithoutDisplayId = getMostRecentWithoutDisplayId(logs);

    const updates = logs.filter(log => log.id === lastCreatedVisit?.id && log.updationStatus === 'Updation Successful');
    const deletions = logs.filter(log => log.visit_id === lastCreatedVisit?.id && log.deletion_status === 'Deleted');

    return { lastCreatedVisit, updates, deletions, mostRecentWithoutDisplayId };
};

// Function to find the last created objective and its associated updates and deletions
const getLastCreatedObjective = (logs) => {
    const lastCreatedObjective = logs
        .filter(log => log.value && log.value.id)
        .sort((a, b) => new Date(b.value.adminData.createdOn) - new Date(a.value.adminData.createdOn))[0];

    const updates = logs.filter(log => log.Objective_id === lastCreatedObjective.value.id && log.updation_status === 'Updation Successful');
    const deletions = logs.filter(log => log.Objective_id === lastCreatedObjective.value.id && log.deletion_status === 'Deleted');

    return { lastCreatedObjective, updates, deletions };
};

// Function to generate the PDF report
const generatePDF = (visitData, objectiveData, middlewareLogs) => {
    const doc = new PDFDocument();
    const pdfFilePath = 'last_visit_and_objective_report.pdf';

    doc.pipe(fs.createWriteStream(pdfFilePath));
    doc.fontSize(20).text('Visit and Objective Report (Last Created)', { underline: true });
    doc.fontSize(12).text('\n');

    const { lastCreatedVisit, updates, deletions, mostRecentWithoutDisplayId } = visitData;
    doc.fontSize(16).text('Visit Creation:', { bold: true });
    
    if (lastCreatedVisit) {
        doc.fontSize(12).text(`Display ID: ${lastCreatedVisit.displayid || 'N/A'}`);
        doc.text(`ID: ${lastCreatedVisit.id || 'N/A'}`);
        doc.text(`Scheduled Start: ${lastCreatedVisit.scheduledStartDateTime || 'N/A'}`);
        doc.text(`Scheduled End: ${lastCreatedVisit.scheduledEndDateTime || 'N/A'}`);
        doc.text(`Created By: ${lastCreatedVisit.createdBy || 'N/A'}`);
        doc.text(`Log Time (IST): ${lastCreatedVisit.logTimeIST || 'N/A'}`);
        doc.text('\n');
    } else {
        doc.fontSize(12).text('No visit creation logs available.');
    }

    // Check if there was a recent visit without a display ID and log the status code
    if (mostRecentWithoutDisplayId) {
        doc.fontSize(16).text('Recent Visit without Display ID:', { bold: true });
        doc.fontSize(12).text(`Status Code: ${mostRecentWithoutDisplayId.statusCode || 'N/A'}`);
        doc.text(`Log Time (IST): ${mostRecentWithoutDisplayId.logTimeIST || 'N/A'}`);
        doc.text('\n');
    }

    // Existing PDF generation code for updates and deletions
    doc.fontSize(16).text('Visit Updation:', { bold: true });
    if (updates.length > 0) {
        updates.forEach(log => {
            doc.fontSize(12).text(`ID: ${log.id || 'N/A'}`);
            doc.text(`Updation Status: ${log.updationStatus || 'N/A'}`);
            doc.text(`Log Time (IST): ${log.logTimeIST || 'N/A'}`);
            doc.text('\n');
        });
    } else {
        doc.fontSize(12).text('No visit updation logs available.');
    }

    doc.fontSize(16).text('Visit Deletion:', { bold: true });
    if (deletions.length > 0) {
        deletions.forEach(log => {
            doc.fontSize(12).text(`Visit ID: ${log.visit_id || 'N/A'}`);
            doc.text(`Deletion Status: ${log.deletion_status || 'N/A'}`);
            doc.text(`Log Time (IST): ${log.logTimeIST || 'N/A'}`);
            doc.text('\n');
        });
    } else {
        doc.fontSize(12).text('No visit deletion logs available.');
    }

    const { lastCreatedObjective, updates: objectiveUpdates, deletions: objectiveDeletions } = objectiveData;
    doc.fontSize(16).text('Objective Creation:', { bold: true });

    if (lastCreatedObjective && lastCreatedObjective.value) {
        const obj = lastCreatedObjective.value;
        doc.fontSize(12).text(`Objective ID: ${obj.id || 'N/A'}`);
        doc.text(`Description: ${obj.description || 'N/A'}`);
        doc.text(`Owner: ${obj.owner.formattedName || 'N/A'}`);
        doc.text(`Task Category: ${obj.taskCategoryDescription || 'N/A'}`);
        doc.text(`Priority: ${obj.priority || 'N/A'}`);
        doc.text(`Created By: ${obj.adminData.createdByName || 'N/A'}`);
        doc.text(`Log Time (IST): ${lastCreatedObjective.logTimeIST || 'N/A'}`);
        doc.text('\n');
    } else {
        doc.fontSize(12).text('No objective creation logs available.');
    }

    doc.fontSize(16).text('Objective Updation:', { bold: true });
    if (objectiveUpdates.length > 0) {
        objectiveUpdates.forEach(log => {
            doc.fontSize(12).text(`Objective ID: ${log.Objective_id || 'N/A'}`);
            doc.text(`Updation Status: ${log.updation_status || 'N/A'}`);
            doc.text(`Log Time (IST): ${log.logTimeIST || 'N/A'}`);
            doc.text('\n');
        });
    } else {
        doc.fontSize(12).text('No objective updation logs available.');
    }

    doc.fontSize(16).text('Objective Deletion:', { bold: true });
    if (objectiveDeletions.length > 0) {
        objectiveDeletions.forEach(log => {
            doc.fontSize(12).text(`Objective ID: ${log.Objective_id || 'N/A'}`);
            doc.text(`Deletion Status: ${log.deletion_status || 'N/A'}`);
            doc.text(`Log Time (IST): ${log.logTimeIST || 'N/A'}`);
            doc.text('\n');
        });
    } else {
        doc.fontSize(12).text('No objective deletion logs available.');
    }

    doc.fontSize(16).text('Recent Middleware Logs:', { bold: true });
    middlewareLogs.forEach(log => {
        doc.fontSize(12).text(log);
    });

    doc.end();
    console.log(`Report generated: ${pdfFilePath}`);
    return pdfFilePath;
};

// Function to run scripts sequentially
const runScriptsSequentially = (scripts) => {
    let index = 0;

    const runNext = () => {
        if (index < scripts.length) {
            exec(`node ${scripts[index]}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing ${scripts[index]}:`, error);
                    if (stderr) {
                        console.error(`stderr of ${scripts[index]}:`, stderr);
                    }
                } else {
                    console.log(`Output of ${scripts[index]}:\n`, stdout);
                }

                index++; // Move to the next script
                runNext(); // Continue to the next script regardless of the error
            });
        } else {
            const visitLogs = getLogs('visit_creation_log.txt');
            const objectiveLogs = getLogs('objectivelogs.txt');
            const middlewareLogs = getRecentMiddlewareLogs('middlewarelog.txt');

            const lastVisitData = getLastCreatedVisit(visitLogs);
            const lastObjectiveData = getLastCreatedObjective(objectiveLogs);

            const pdfFilePath = generatePDF(lastVisitData, lastObjectiveData, middlewareLogs);

            // Check if we need to send an email based on the most recent without display ID
            if (lastVisitData.mostRecentWithoutDisplayId) {
                console.log("Sending email due to recent visit without display ID...");
                exec(`node email_auto.js`, (error, stdout, stderr) => {
                    if (error) {
                        console.error("Error executing email_auto.js:", error);
                        return;
                    }
                    console.log("Output of email_auto.js:\n", stdout);
                });
            } else {
                checkForErrorsInPDF(pdfFilePath).then(hasError => {
                    if (hasError) {
                        console.log("Error found in PDF report. Running email_auto.js...");
                        exec(`node email_auto.js`, (error, stdout, stderr) => {
                            if (error) {
                                console.error("Error executing email_auto.js:", error);
                                return;
                            }
                            console.log("Output of email_auto.js:\n", stdout);
                        });
                    } else {
                        console.log("No errors found in PDF report.");
                    }
                }).catch(error => {
                    console.error('Error checking PDF for errors:', error);
                });
            }
        }
    };

    runNext();
};

// Start running scripts
// runScriptsSequentially(scripts);


cron.schedule('00 16 * * *', () => {
    console.log('Running scheduled task');
    runScriptsSequentially(scripts);
});


