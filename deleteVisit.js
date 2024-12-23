const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
const logFilePath = 'flag_deletion_log.txt'; // 1


// Function to get the last visit ID from the log file
function getLastVisitId(logFile = 'visit_creation_log.txt') {
    try {
        const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            const visitData = JSON.parse(lastLine);
            return visitData.id; // Extract the visit ID
        } else {
            console.log("Log file is empty.");
            return null;
        }
    } catch (error) {
        console.error(`Log file '${logFile}' not found.`);
        return null;
    }
}

// Function to log the deletion event in the same log file
function logDeletion(visitId, logFile = 'visit_creation_log.txt') {
    const deletionLog = {
        visit_id: visitId,
        deletion_status: 'Deleted',
        logTimeIST: getCurrentISTTime()
    };

    fs.appendFileSync(logFile, JSON.stringify(deletionLog) + "\n", 'utf-8'); // Append the log entry
}

// Function to get the current time in IST
function getCurrentISTTime() {
    return moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
}

// Function to delete the visit
let Flag_delete; //2
async function deleteVisit(visitId) {
    const baseUrl = "https://sales2.vlab.crm.cloud.sap/sap/c4c/api/v1/visit-service/visits/";
    const url = baseUrl + visitId;

    const headers = {
        'Authorization': 'Basic dXNzYWxlc3JlcDAxOk5vcnRoJHRhcjE=' // Ensure credentials are correct
    };

    try {
        const response = await axios.delete(url, { headers });
        
        if (response.status === 204) { // 204 means success with no content
            console.log(`Visit ${visitId} successfully deleted.`);
            Flag_delete = 0;
            logDeletion(visitId); // Log the deletion after success
        } else {
            console.log(`Failed to delete visit ${visitId}. Response: ${response.data}`);
            Flag_delete = 1;
        }
        
        return response.status;
        
    } catch (error) {
        console.error(`Error deleting visit ${visitId}:`, error.message);
        Flag_delete = 1;
        return error.response ? error.response.status : 500;
        
    }
    
}
// Main execution
(async () => {
    const visitId = getLastVisitId(); // Get the last created visit ID from log
    if (visitId) {
        console.log(`Attempting to delete visit with ID: ${visitId}`);
        await deleteVisit(visitId);
    } else {
        console.log("No visit ID found to delete.");
    }
    fs.writeFileSync(logFilePath, Flag_delete.toString(), 'utf-8'); // 6
     console.log(`Flag_create value logged: ${Flag_delete}`); //7

})();
