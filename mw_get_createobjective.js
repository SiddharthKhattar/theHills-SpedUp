const axios = require("axios").default;
const fs = require('fs');
const logFilePath = 'flag_mw_objective_log.txt'; // 1
let Flag_create = 0; // Initialize Flag_create

function getObjectiveID(logFile = 'objectivelogs.txt') {
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

function readAccessToken(tokenFile = 'access_token.txt') {
    try {
        return fs.readFileSync(tokenFile, 'utf-8').trim();
    } catch (error) {
        console.error(`Access token file '${tokenFile}' not found.`);
        return null;
    }
}

async function refreshAccessToken(refreshToken) {
    try {
        const response = await axios.post('https://sales2-dev-com-sap-rex-app.cfapps.eu30.hana.ondemand.com/oauth2/api/v1/token', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });
        fs.writeFileSync('access_token.txt', response.data.access_token);
        console.log("Access token refreshed and saved.");
        return response.data.access_token;
    } catch (error) {
        console.error("Error refreshing access token:", error.message);
        throw error;
    }
}

async function makeApiRequest() {
    const objectiveID = getObjectiveID();
    const accessToken = readAccessToken();
  
    if (!accessToken) {
        Flag_create = 1;
        return; // Exit if no access token is found
    }

    let options = {
        method: 'GET',
        url: `https://sales2-dev-com-sap-rex-app.cfapps.eu30.hana.ondemand.com/com.sap.rex.app/ObjectiveSet(${objectiveID})`,
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };

    try {
        const response = await axios.request(options);
        const logMessage = `ID: ${objectiveID}, Status Code: ${response.status}, Exists: Yes\n`;
        fs.appendFileSync('middlewarelog.txt', logMessage);
        console.log("Log written to middlewarelog.txt");
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) { // Unauthorized
                console.log("Access token expired. Refreshing...");
                const refreshToken = 'bd81150178224a9fb050b25634e333c8-r'; // Replace with your actual refresh token
                const newAccessToken = await refreshAccessToken(refreshToken);
                options.headers.Authorization = `Bearer ${newAccessToken}`; // Update headers

                // Retry the request with the new access token
                const retryResponse = await axios.request(options);
                const logMessage = `ID: ${objectiveID}, Status Code: ${retryResponse.status}, Exists: Yes (After Refresh)\n`;
                Flag_create = 0;
                fs.appendFileSync('middlewarelog.txt', logMessage);
            } else {
                const logMessage = `ID: ${objectiveID}, Error Status Code: ${error.response.status}, Exists: No\n`;
                Flag_create = 1;
                fs.appendFileSync('middlewarelog.txt', logMessage);
            }
        } else {
            console.error("Error:", error.message);
            Flag_create = 1;
        }
    } finally {
        fs.writeFileSync(logFilePath, Flag_create.toString(), 'utf-8'); // Write the flag at the end
        console.log(`Flag_create value logged: ${Flag_create}`); // Log the flag value
    }
}

makeApiRequest();
