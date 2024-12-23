const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
// Function to get current IST time
function getCurrentISTTime() {
    return moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
}

// Function to get the last visit ID from the log file
function getLastVisitId(logFile = 'visit_creation_log.txt') {
    try {
        const lines = fs.readFileSync(logFile, 'utf-8').trim().split('\n');
        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            const visitData = JSON.parse(lastLine);
            return visitData.id;
        } else {
            console.log("Log file is empty.");
            return null;
        }
    } catch (error) {
        console.error(`Log file '${logFile}' not found.`);
        return null;
    }
}

const visitId = getLastVisitId();
const url = `https://sales2.vlab.crm.cloud.sap/sap/c4c/api/v1/visit-service/visits/${visitId}`;
const payload = {
    account: {
        id: "11ee5d03-ae12-90fe-afdb-81a16b020a00"
    },
    scheduledStartDateTime: "2024-09-25T08:06:17Z",
    scheduledEndDateTime: "2024-09-25T09:06:17Z",
    plannedDuration: "PT1H",
    owner: {
        id: "11ef0615-87cc-5b4e-afdb-816346020a00"
    },
    organizer: {
        id: "11ef0615-87cc-5b4e-afdb-816346020a00"
    },
    primaryContact: {
        id: "11ee5d04-33b4-ec8e-afdb-810f21020a00"
    },
    location: "Silverlight Enterprises IN",
    visitType: "0001",
    visitTypeDescription: "General Visit",
    priority: "NORMAL",
    description: "Insomnia updated visit",
    timeZone: "UTC"
};

const headers = {
    'Authorization': 'Basic VVNTQUxFU1JFUDAxOk5vcnRoJHRhcjE=',
    'Content-Type': 'application/json'
};

// Function to log visit details
function logVisit(visitDetails) {
    const logFile = 'visit_creation_log.txt';
    visitDetails.logTimeIST = getCurrentISTTime(); // Add IST time to visit details

    fs.appendFileSync(logFile, JSON.stringify(visitDetails) + "\n", 'utf-8'); // Write to file
}

// Function to update visit
let Flag_update;
const logFilePath = 'flag_updateVisit_log.txt'; // 1


async function updateVisit() {
    try {
        const response = await axios.put(url, payload, { headers });
        const statusCode = response.status;
        
        console.log(response.data);
        console.log(statusCode);

        // Handle GET request if PUT is successful
        if (statusCode === 204) {
            const responseData = await axios.get(url, { headers });
            const visitData = responseData.data.value || {};
            const visitId1 = visitData.id;
            const scheduledStart = visitData.scheduledStartDateTime;
            const scheduledEnd = visitData.scheduledEndDateTime;
            const displayId = visitData.displayId;
            const createdBy = visitData.adminData?.createdBy;

            const updationStatus = (statusCode === 204) ? "Updation Successful" : "Updation Unsuccessful";

            const visitDetails = {
                displayid: displayId,
                id: visitId1,
                scheduledStartDateTime: scheduledStart,
                scheduledEndDateTime: scheduledEnd,
                createdBy: createdBy,
                statusCode: statusCode,
                updationStatus: updationStatus
            };

            console.log("Updated Successfully");
            console.log(visitDetails);
            logVisit(visitDetails);
            Flag_update = 0; // 3

        } else {
            console.error(`Error: ${statusCode}, ${response.data}`);
            Flag_update = 1;//4
        }
    } catch (error) {
        console.error('Error occurred:', error.message);
        Flag_update = 1;//5
    }
    fs.writeFileSync(logFilePath, Flag_update.toString(), 'utf-8'); // 6
    console.log(`Flag_update value logged: ${Flag_update}`); //7

}

// Call the update function
updateVisit();
