const dataAccusation = require('../data/dataAqusition');
const imageGenerator = require('../imageGenaration/imageGenerator');
const streams = require('memory-streams');


exports.getCarbonRoseHandler = async (event) => {
    let daysBack = isInt(event.pathParameters.days) ? Number(event.pathParameters.days) : 1;
    console.log('daysback:'+daysBack);

    const collectedData = await Promise.all([
                                 dataAccusation.collectDataFromDaysPast('netamakkari','co2',daysBack),
                                 dataAccusation.collectDataFromDaysPast('netatmo','co2',daysBack)]);
    const [norm1,norm2] = collectedData.map(dataAccusation.normalizer);
    
    const img = imageGenerator.generateBaseImage();
    imageGenerator.addDataIntoImage(img,norm1,'rgba(0,0,255, 0.5)');
    imageGenerator.addDataIntoImage(img,norm2,'rgba(255,0,0, 0.5)');
    const memoryStream = new streams.WritableStream();
    await imageGenerator.writeImageDataToStream(img,memoryStream);

    const response = {
        statusCode: 200,
        body: memoryStream.toBuffer().toString('base64'),
        isBase64Encoded: true,
        headers: {
            "content-type" : "image/png"
        },
    };

    // All log statements are written to CloudWatch
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
}

function isInt(value) {
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
  }