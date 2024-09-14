function doPost(e) {
    return handleRequest(e);
  }
  
  function handleRequest(e) {
    var output = ContentService.createTextOutput();
    var data = {};
  
    // Parse data from POST parameters
    if (e.parameter && e.parameter.data) {
      try {
        data = JSON.parse(e.parameter.data);
      } catch (error) {
        console.error('Error parsing data from parameters:', error);
      }
    }
  
    if (data.workoutDetails) {
      try {
        const ss = SpreadsheetApp.openById('1XULnWjy9I6kYuqh2ttPBFIzKr_swWJ91nTJy8wFOkls'); // Replace with your Spreadsheet ID
        const detailsSheet = ss.getSheetByName('WorkoutDetails'); // Sheet for workout details
        const splitsSheet = ss.getSheetByName('Splits'); // Sheet for splits
  
        // Insert workout details
        const workoutDetails = data.workoutDetails;
        const detailsRow = [
          new Date(), // Timestamp
          workoutDetails.time || '234',
          workoutDetails.distance || '',
          workoutDetails.activeCalories || '',
          workoutDetails.totalCalories || '',
          workoutDetails.elevationGain || '',
          workoutDetails.avgPower || '',
          workoutDetails.avgCadence || '',
          workoutDetails.avgPace || '',
          workoutDetails.avgHeartRate || ''
        ];
        detailsSheet.appendRow(detailsRow);
  
        // Insert splits if available
        if (data.splits && data.splits.length > 0) {
          // Optionally, add a header or separator between entries
          splitsSheet.appendRow(['Timestamp', 'Split Number', 'Time', 'Pace', 'Heart Rate']);
  
          data.splits.forEach(split => {
            splitsSheet.appendRow([
              new Date(),
              split.splitNumber || '',
              split.time || '',
              split.pace || '',
              split.heartRate || ''
            ]);
          });
        }
  
        var response = { status: 'success', message: 'Data processed successfully' };
        output.setContent(JSON.stringify(response));
      } catch (error) {
        console.error('Error processing data:', error);
        var response = { status: 'error', message: error.toString() };
        output.setContent(JSON.stringify(response));
      }
    } else {
      var response = { status: 'error', message: 'Invalid request: No data provided' };
      output.setContent(JSON.stringify(response));
    }
  
    output.setMimeType(ContentService.MimeType.JSON);
  
    // Set CORS headers
    output.appendHeader('Access-Control-Allow-Origin', '*');
  
    return output;
  }
  