const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
const logFilePath = 'flag_create_log.txt'; // 1


const url = "https://sales2.vlab.crm.cloud.sap/sap/c4c/api/v1/visit-service/visits";

const payload = {
    description: "Visit for TE Certified from Insomnia",
    timeZone: "UTC",
    visitType: "0001",
    account: {
        id: "11ef6850-3835-8ffe-afdb-813d25020a00"
    },
    primaryContact: {
        id: "11ef6850-3ec5-dc3e-afdb-813d25020a00"
    },
    owner: {
        id: "11ef0615-87cc-5b4e-afdb-816346020a00"
    },
    organizer: {
        id: "11ef0615-87cc-5b4e-afdb-816346020a00"
    },
    status: "OPEN",
    location: "TE Certified 9800 Old Dogwood Rd / Roswell 30075 / US",
    priority: "IMMEDIATE",
    plannedDuration: "PT2H",
    scheduledStartDateTime: "2024-09-16T13:00:00Z",
    scheduledEndDateTime: "2024-09-16T15:00:00Z"
};

const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic dXNzYWxlc3JlcDAxOk5vcnRoJHRhcjE='
};

// Function to get the current time in IST
function getCurrentISTTime() {
    return moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
}

// Function to log the result locally with IST time
function logVisit(visitDetails) {
    const logFile = 'visit_creation_log.txt';
    visitDetails.logTimeIST = getCurrentISTTime(); // Add IST time to visit details

    fs.appendFileSync(logFile, JSON.stringify(visitDetails) + "\n", 'utf-8'); // Write to file
}

// Declare Flag_create outside the function
let Flag_create; //2

async function createVisit() {
    try {
        const response = await axios.post(url, payload, { headers });
        
        // Store the status code
        const statusCode = response.status;
        if (statusCode === 201) {
            const data = response.data;
            const visitData = data.value || {};
            const displayId = visitData.displayId;
            const visitId = visitData.id;
            const scheduledStart = visitData.scheduledStartDateTime;
            const scheduledEnd = visitData.scheduledEndDateTime;
            const createdBy = visitData.adminData?.createdBy;

            const visitDetails = {
                displayId: displayId,
                id: visitId,
                scheduledStartDateTime: scheduledStart,
                scheduledEndDateTime: scheduledEnd,
                createdBy: createdBy,
                statusCode: statusCode // Include status code in the output
            };

            // Log the visit details to a local file with IST timestamp
            logVisit(visitDetails);
            Flag_create = 0; // 3
            console.log("Working fine");
            
        } else {
            const errorMessage = {
                statusCode: statusCode,
                error: response.data
            };
            console.error(`Error: ${statusCode}, ${response.data}`);

            // Log the error details to a local file with IST timestamp
            logVisit(errorMessage);
            Flag_create = 1; // 4
            console.log("Not Working fine");
        }
    } catch (error) {
        const errorMessage = {
            statusCode: error.response?.status || 500,
            error: error.message
        };
        console.error('Error occurred:', errorMessage);

        // Log the error details to a local file with IST timestamp
        logVisit(errorMessage);
        Flag_create = 1; // 5
        console.log("Not Working fine");
    }
    console.log(Flag_create);
     // Log the Flag_create value to a file
     fs.writeFileSync(logFilePath, Flag_create.toString(), 'utf-8'); // 6
     console.log(`Flag_create value logged: ${Flag_create}`); //7
}

createVisit();

