function doPost(e) {
    var output = ContentService.createTextOutput();
    var data;
  
    try {
        data = JSON.parse(e.postData.contents);
    } catch (error) {
        output.setContent(JSON.stringify({ status: 'error', message: 'Invalid JSON data' }));
        return output;
    }

    try {
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = ss.getSheetByName('Workouts') || ss.insertSheet('Workouts');
        
        // Get the next available column
        var lastColumn = sheet.getLastColumn();
        var nextColumn = lastColumn + 1;
        
        // Prepare the data for insertion
        var columnData = [
            new Date(), // Date
            data.workoutDetails.time || '',
            data.workoutDetails.distance || '',
            data.workoutDetails.activeCalories || '',
            data.workoutDetails.totalCalories || '',
            data.workoutDetails.elevationGain || '',
            data.workoutDetails.avgPower || '',
            data.workoutDetails.avgCadence || '',
            data.workoutDetails.avgPace || '',
            data.workoutDetails.avgHeartRate || ''
        ];

        // Add splits data
        if (data.splits && data.splits.length > 0) {
            data.splits.forEach(split => {
                columnData.push(split.splitNumber || '');
                columnData.push(split.time || '');
                columnData.push(split.pace || '');
                columnData.push(split.heartRate || '');
            });
        }

        // Insert the data as a new column
        sheet.getRange(1, nextColumn, columnData.length, 1).setValues(columnData.map(item => [item]));

        output.setContent(JSON.stringify({ status: 'success', message: 'Data inserted successfully' }));
    } catch (error) {
        output.setContent(JSON.stringify({ status: 'error', message: error.toString() }));
    }

    output.setMimeType(ContentService.MimeType.JSON);
    return output;
}

function doGet(e) {
    return doPost(e);
}
