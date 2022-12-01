const API_KEY = "931d4f24e8105f59f0ea8ea8226d84da";
const DAYS_OF_THE_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
let SelectedCity, SelectedCityText;

const getCitiesUsingGeoLocation = async (searchText) => {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_KEY}`);
    return response.json()
}

const getCurrentWeatherData = async ({ lat, lon, name: city }) => {
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    // const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${name}&appid=${API_KEY}&units=metric`);
    const url = lat && lon ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric` : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    return response.json();
}

const formatTemperature = (temp) => `${temp?.toFixed(1)}°`;
const createIconUrl = (icon) => `http://openweathermap.org/img/wn/${icon}@2x.png`

const loadCurrentForecast = ({ name, main: { temp, temp_max, temp_min }, weather: [{ description }] }) => {
    const currentForecastElement = document.querySelector("#current-forecast");
    currentForecastElement.querySelector(".city").textContent = name;
    currentForecastElement.querySelector(".temp").textContent = formatTemperature(temp);
    currentForecastElement.querySelector(".description").textContent = description;
    currentForecastElement.querySelector(".min-max-temp").textContent = `L: ${formatTemperature(temp_max)} H: ${formatTemperature(temp_min)}`;
}

const getHourlyForecast = async ({ name: city }) => {
    const response = await fetch(`http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    const data = await response.json();
    return data.list.map(forecast => {
        const { main: { temp, temp_max, temp_min }, dt, dt_txt, weather: [{ description, icon }] } = forecast;
        return { temp, temp_max, temp_min, dt, dt_txt, description, icon };
    })
}
const loadHourlyForecast = ({ main: { temp: tempNow }, weather: [{ icon: iconNow }] }, hourlyForecast) => {
    // console.log(hourlyForecast);
    let dataFor12Hours = hourlyForecast.slice(2, 14);
    const dateFormat = Intl.DateTimeFormat('en', {
        hour12: true, hour: "2-digit"
    })

    const hourlyContainer = document.querySelector('.hourly-container');
    let innerHTMLstring = `<article>
        <h3 class='time'>Now</h3>
        <img class='icon' src="${createIconUrl(iconNow)}" />
        <p class='temp'>${formatTemperature(tempNow)}</p>
        </article>`

    for (let { temp, icon, dt_txt } of dataFor12Hours) {
        innerHTMLstring += `<article>
        <h3 class='time'>${dateFormat.format(new Date(dt_txt))}</h3>
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
        // console.log(dayOfTheWeek);
        if (dayWiseForecast.has(dayOfTheWeek)) {
            let forecastForTheDay = dayWiseForecast.get(dayOfTheWeek);
            forecastForTheDay.push(forecast)
            dayWiseForecast.set(dayOfTheWeek, forecastForTheDay)
        }
        else {
            dayWiseForecast.set(dayOfTheWeek, [forecast])
        }
    }
    for (let [key, value] of dayWiseForecast) {
        let temp_max = Math.max(...Array.from(value, val => val.temp_max))
        let temp_min = Math.min(...Array.from(value, val => val.temp_min))
        dayWiseForecast.set(key, { temp_min, temp_max, icon: value.find(v => v.icon).icon })
    }
    return dayWiseForecast

}

const loadFiveDayForecast = (hourlyForecast) => {
    const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
    // console.log(Array.from(dayWiseForecast));
    const dayWiseContainer = document.querySelector('.five-day-forecast-container');
    let innerHTMLstring = "";
    Array.from(dayWiseForecast).map(([day, { temp_max, temp_min, icon }], index) => {
        if (index < 5) {
            innerHTMLstring += `<article class="day-wise-forecast">
        <h3 class='day'>${index === 0 ? "Today" : day}</h3>
        <img class='icon' src="${createIconUrl(icon)}" />
        <p class='min_temp'>${formatTemperature(temp_min)}</p>
        <p class='max_temp'>${formatTemperature(temp_max)}</p>
        </article>`
        }
    })

    dayWiseContainer.innerHTML = innerHTMLstring
}
function deBounce(func) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args)
        }, 700)
    }
}


const onsearchChange = async (event) => {
    let { value } = event.target;
    if (value) {
        SelectedCity = null;
        SelectedCityText = '';
    }
    if (value && SelectedCityText !== value) {

        const listOfCity = await getCitiesUsingGeoLocation(value);
        // console.log({ listOfCity });
        let optionText = '';
        for (let { lat, lon, name, country, state } of listOfCity) {
            optionText += `<option class="option" data-city-details=${JSON.stringify({ lat, lon, name })} value="${name},${state},${country}" ></option>`
        }
        // console.log(optionText);
        document.querySelector("#cities").innerHTML = optionText
    }
}

const loadForecastUsingGoeLocation = () => {
    navigator.geolocation.getCurrentPosition(({coords}) => {
        const { latitude:lat, longitude:lon} = coords;
        SelectedCity= {lat,lon};
        loadData();
    }, error => console.log(error))
}

const loadData = async () => {

    const currentWeather = await getCurrentWeatherData(SelectedCity);
    loadCurrentForecast(currentWeather);
    const hourlyForecast = await getHourlyForecast(currentWeather);
    loadHourlyForecast(currentWeather, hourlyForecast);
    console.log(currentWeather);
    console.log(hourlyForecast);
    loadFeelsLike(currentWeather)
    loadFeelsLikehumi(currentWeather)
    loadFiveDayForecast(hourlyForecast);
}

const HandleCitySelection = (event) => {
    SelectedCityText = event.target.value;
    let options = document.querySelectorAll(".option");
    // console.log(options);
    if (options?.length) {
        let selectedOption = Array.from(options).find(opt => opt.value === SelectedCityText)
        SelectedCity = JSON.parse(selectedOption.getAttribute("data-city-details"))
        console.log({ SelectedCity });
        // return {SelectedCity};
        loadData();
    }
}

const deBounceSearch = deBounce((event) => onsearchChange(event))


document.addEventListener("DOMContentLoaded", async () => {
    loadForecastUsingGoeLocation();
    const searchText = document.querySelector('#search')
    searchText.addEventListener("input", deBounceSearch)
    searchText.addEventListener("change", HandleCitySelection)

})