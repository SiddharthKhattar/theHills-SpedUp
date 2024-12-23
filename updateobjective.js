const axios = require('axios');
const fs = require('fs');


// Headers for the API request
const headers = {
    'Authorization': 'Basic VVNTQUxFU1JFUDAxOk5vcnRoJHRhcjE=', 
    'Content-Type': 'application/json'
};

// Payload for updating the objective
const payload = {
    "status": "INPROCESS",
    "priority": "LOW"
};

// Function to get the current time in IST
function getCurrentISTTime() {
    const options = {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    return new Date().toLocaleString('en-US', options);
}

function logUpdation(ObjectiveId, updationstatus, status, priority, logFile = 'objectivelogs.txt') {
    const updationLog = {
        Objective_id: ObjectiveId,
        updation_status: updationstatus,
        logTimeIST: getCurrentISTTime(),
        status: status,
        priority: priority
    };

    fs.appendFileSync(logFile, JSON.stringify(updationLog) + "\n", 'utf-8'); // Append the log entry
}

// Function to get the last objective ID from the log file
function getLastObjectiveID(logFile = 'objectivelogs.txt') {
    try {
        const logData = fs.readFileSync(logFile, 'utf-8');
        const regex = /"id":"([a-fA-F0-9-]{36})","description":"[^"]+"/g;
        let match;
        let lastObjectiveId = null;

        // Iterate through all matches and keep updating lastObjectiveId
        while ((match = regex.exec(logData)) !== null) {
            lastObjectiveId = match[1];
        }

        if (lastObjectiveId) {
            console.log(`Last extracted Objective ID: ${lastObjectiveId}`);
            return lastObjectiveId;
        } else {
            console.log("No Objective ID found.");
            return null;
        }

    } catch (error) {
        console.error(`Log file '${logFile}' not found or cannot be read:`, error.message);
        return null;
    }
}

const objectiveId = getLastObjectiveID();
const logFilePath0 = 'flag_createobj_log.txt'; // 1.1
const logFilePath = 'flag_updateobj_log.txt'; // 1.2
let Flag_update; //2
let Flag_create = 0;

async function updateObjective() {
    if (!objectiveId) {
        console.error("No valid objective ID found. Exiting update.");
        Flag_create = 1;
        return;
    }
    fs.writeFileSync(logFilePath0, Flag_create.toString(), 'utf-8'); 
    console.log(`Flag_createobjective value logged: ${Flag_create}`); 

    const url = `https://sales2.vlab.crm.cloud.sap/sap/c4c/api/v1/visit-objective-task-service/objectives/${objectiveId}`;

    try {
        const response = await axios.put(url, payload, { headers });
        const statusCode = response.status;

        console.log(response.data);
        console.log(statusCode);
        const updationStatus = (statusCode === 204) ? "Updation Successful" : "Updation Unsuccessful";
        if (statusCode === 204) {
            console.log("Updation Success");
            logUpdation(objectiveId, updationStatus, payload.status, payload.priority); // Log status and priority
            Flag_update = 0;
        }
        else{
            console.log("Updation Unsuccessful");
            Flag_update = 1;
        }

    } catch (error) {
        console.error('Error occurred:', error.message);
        Flag_update = 1;
    }
    fs.writeFileSync(logFilePath, Flag_update.toString(), 'utf-8'); // 6
    console.log(`Flag_createobjective value logged: ${Flag_update}`); //7
}

updateObjective();
