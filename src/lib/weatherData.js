var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { format, parseISO, addDays, getOverlappingDaysInIntervals } from 'date-fns';
export const climateModels = [
    {
        specifier: 'CMCC_CM2_VHR4',
        country: 'Italy',
        link: 'https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.CMCC.CMCC-CM2-VHR4'
    },
    {
        specifier: 'FGOALS_f3_H',
        country: 'China',
        link: 'https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.CAS.FGOALS-f3-H'
    },
    {
        specifier: 'HiRAM_SIT_HR',
        country: 'Taiwan',
        link: 'https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.AS-RCEC.HiRAM-SIT-HR'
    },
    {
        specifier: 'MRI_AGCM3_2_S',
        country: 'Japan',
        link: 'https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.MRI.MRI-AGCM3-2-S.highresSST-present'
    },
    {
        specifier: 'EC_Earth3P_HR',
        country: 'Europe',
        link: 'https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.EC-Earth-Consortium.EC-Earth3P-HR'
    },
    {
        specifier: 'MPI_ESM1_2_XR',
        country: 'Germany',
        link: 'https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.MPI-M.MPI-ESM1-2-XR'
    },
    {
        specifier: 'NICAM16_8S',
        country: 'Japan',
        link: 'https://www.wdc-climate.de/ui/cmip6?input=CMIP6.HighResMIP.MIROC.NICAM16-8S'
    }
];
export default function getCombinedHistoricalAndForecastWeatherData(lat, lon, dateFrom = parseISO('1950-01-01'), dateTo = parseISO('2050-12-31')) {
    return __awaiter(this, void 0, void 0, function* () {
        // split up data into two parts:
        // history from ERA5 up until today
        // future from climate modeling for future days
        let dateFromHistory = dateFrom;
        // era5-data is released with some lag
        let dateToHistory = addDays(new Date(), -14);
        let dateFromForecast = addDays(dateToHistory, 1);
        let dateToForecast = dateTo;
        let resHistorical = yield getHistoricalWeatherData(lat, lon, dateFromHistory, dateToHistory);
        let resForecast = yield getClimateForecastWeatherData(lat, lon, dateFromForecast, dateToForecast);
        if (!resForecast)
            return;
        if (!resHistorical)
            return;
        return ({
            forecast: resForecast,
            history: resHistorical
        });
    });
}
function getGenericDailyDataFromOpenMeteo(endpoint, lat, lon, dateFrom, dateTo, additionalParams = '') {
    return __awaiter(this, void 0, void 0, function* () {
        const df = format(dateFrom, 'yyyy-MM-dd');
        const dt = format(dateTo, 'yyyy-MM-dd');
        let api = endpoint
            + '?latitude=' + Math.round(100 * lat) / 100
            + '&longitude=' + Math.round(100 * lon) / 100
            + '&start_date=' + df
            + '&end_date=' + dt
            + '&daily=temperature_2m_max,temperature_2m_min,rain_sum,snowfall_sum&timezone=Europe%2FBerlin'
            + additionalParams;
        const resDirect = yield fetch(api);
        const res = yield resDirect.json();
        return (res.daily);
    });
}
function getClimateForecastWeatherData(lat, lon, dateFrom, dateTo) {
    return __awaiter(this, void 0, void 0, function* () {
        const allModels = climateModels.map(m => m.specifier).join(',');
        let res = yield getGenericDailyDataFromOpenMeteo('https://climate-api.open-meteo.com/v1/climate', lat, lon, dateFrom, dateTo, '&models=' + allModels);
        return res;
    });
}
// Averages out all columns that start with targetCol in res
// Currently not in use as averaging out long-term-forecasts creates  
// unrealistic scenarios. Only keeping this in case it may become relevant
// at a later point in time.
function ensemble(res, targetCol) {
    let colNames = Object.keys(res);
    // get all cols starting with targetCol
    const regexp = new RegExp('^' + targetCol);
    let relevantCols = colNames.filter(i => regexp.test(i));
    // initialize target column and N counter
    res[targetCol] = new Array(res[relevantCols[1]].length).fill(0);
    res[targetCol + '_n'] = new Array(res[relevantCols[1]].length).fill(0);
    // add up element-wise and keep track of non-NA count
    relevantCols.map(col => {
        res[targetCol] = addvector(res[col], res[targetCol]);
        res[targetCol + '_n'] = addvector(res[targetCol + '_n'], res[col].map((i) => i === null ? 0 : 1));
    });
    // aaand divide
    res[targetCol] = res[targetCol].map((item, index) => Math.round(100 * (item / res[targetCol + '_n'][index])) / 100);
    return (res);
}
function addvector(a, b) {
    return a.map((e, i) => e + b[i]);
}
function getHistoricalWeatherData(lat, lon, dateFrom, dateTo) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield getGenericDailyDataFromOpenMeteo('https://archive-api.open-meteo.com/v1/era5', lat, lon, dateFrom, dateTo);
    });
}
//# sourceMappingURL=weatherData.js.map