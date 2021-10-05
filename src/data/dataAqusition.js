const { InfluxDB } = require('@influxdata/influxdb-client');
const url = process.env.INFLUXURL
const token = process.env.INFLUXTOKEN
const org = process.env.INFLUXORG
const bucket = process.env.INFLUXBUCKET

const queryApi = new InfluxDB({ url, token }).getQueryApi(org);

function normalizer(linedata) {
    const { min, max } = linedata.reduce((previous, current) => {
        if (previous.min > current._value)
            return { max: previous.max, min: current._value }
        if (previous.max < current._value)
            return { max: current._value, min: previous.min }
        return previous;
    },{max:linedata[0]._value,min:linedata[0]._value});

    const valRange = max - min;
    const startMillis = new Date(linedata[0]._time).getTime();
    const stopStopMillis = new Date(linedata[linedata.length - 1]._time).getTime();
    const timeDifference = stopStopMillis - startMillis;

    return linedata.map((row) => {
        return {
            value: (row._value - min) / valRange,
            time: (new Date(row._time).getTime() - startMillis) / timeDifference,
        }
    });
}

async function collectDataFromDaysPast(measurementName,fieldname,daysPast) {
    const startDay= daysPast-1;
    const lines = await queryApi.collectRows(`
    import "date"
    today = date.truncate(t: -${startDay}d, unit: 1d)
    yesterday = date.truncate(t: -${daysPast}d, unit: 1d)
    
    from(bucket: "${bucket}")
      |> range(start: yesterday, stop:today)
      |> filter(fn: (r) => r["_measurement"] == "${measurementName}")
      |> filter(fn: (r) => r["_field"] == "${fieldname}")
      |> aggregateWindow(every: 30m, fn: mean, createEmpty: false)
    `);
    return lines;
}


module.exports = {
    collectDataFromDaysPast,
    normalizer
}
