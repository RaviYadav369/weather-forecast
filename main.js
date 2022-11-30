const API_KEY = "931d4f24e8105f59f0ea8ea8226d84da";
const DAYS_OF_THE_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

const getCurrentWeatherData = async () => {
    const city = "delhi";
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
    return response.json();
}

const formatTemperature = (temp) => `${temp?.toFixed(1)}°`;
const createIconUrl = (icon) => `http://openweathermap.org/img/wn/${icon}@2x.png`

const loadCurrentForecast = ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) => {
    const currentForecastElement = document.querySelector("#current-forecast");
    currentForecastElement.querySelector(".city").textContent = name;
    currentForecastElement.querySelector(".temp").textContent = formatTemperature(temp);
    currentForecastElement.querySelector(".description").textContent = description;
    currentForecastElement.querySelector(".min-max-temp").textContent = `H: ${formatTemperature(temp_max)} L: ${formatTemperature(temp_min)}`;
}

const getHourlyForecast = async ({ name: city }) => {
    const response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    const data = await response.json();
    return data.list.map(forecast => {
        const { main: { temp, temp_max, temp_min }, dt, dt_txt, weather: [{ description, icon }] } = forecast;
        return { temp, temp_max, temp_min, dt, dt_txt, description, icon };
    })
}
const loadHourlyForecast = (hourlyForecast) => {
    // console.log(hourlyForecast);
    let dataFor12Hours = hourlyForecast.slice(1, 13);
    const hourlyContainer = document.querySelector('.hourly-container');
    let innerHTMLstring = "";
    // console.log(temp);
    // hourlyContainer.innerHTML=`<article>
    // <h2 class='time'>${dt_txt.split(" ")[1]}</h2>
    // <img class='icon' src="${createIconUrl(icon)}" />
    // <p class='temp'>${formatTemperature(temp)}</p>
    // </article>`

    for (let { temp, icon, dt_txt } of dataFor12Hours) {
        innerHTMLstring += `<article>
        <h3 class='time'>${dt_txt.split(" ")[1]}</h3>
        <img class='icon' src="${createIconUrl(icon)}" />
        <p class='temp'>${formatTemperature(temp)}</p>
        </article>`
    }
    hourlyContainer.innerHTML = innerHTMLstring
}

const loadFeelsLike = ({ main: { feels_like } }) => {
    const container = document.querySelector("#feels-like");
    container.querySelector(".feels-like-temp").textContent = formatTemperature(feels_like)
}
const loadFeelsLikehumi = ({ main: { humidity } }) => {
    const container = document.querySelector("#feels-humi");
    container.querySelector(".feels-like-humi").textContent = `${humidity}%`
}

const calculateDayWiseForecast = (hourlyForecast) => {
    let dayWiseForecast = new Map();
    for (let forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(" ");
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()]
        console.log(dayOfTheWeek);
        if (dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForTheDay.push(forecast)
            dayWiseForecast.set(dayOfTheWeek, forecastForTheDay)
        }
        else {
            dayWiseForecast.set(dayOfTheWeek, [forecast])
        }
    }
    for(let [key, value] of dayWiseForecast){
        let temp_max = Math.max(...Array.from(value, val => val.temp_max))
        let temp_min = Math.min(...Array.from(value, val => val.temp_min))
        dayWiseForecast.set(key,{temp_min, temp_max,icon:value.find(v => v.icon).icon})
    }
    console.log(dayWiseForecast);
    return dayWiseForecast

}

const loadFiveDayForecast = (hourlyForecast) => {
    const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
    

}

document.addEventListener("DOMContentLoaded", async () => {
    const currentWeather = await getCurrentWeatherData();
    loadCurrentForecast(currentWeather);
    const hourlyForecast = await getHourlyForecast(currentWeather);
    loadHourlyForecast(hourlyForecast);
    console.log(currentWeather);
    console.log(hourlyForecast);
    loadFeelsLike(currentWeather)
    loadFeelsLikehumi(currentWeather)
    loadFiveDayForecast(hourlyForecast);
})